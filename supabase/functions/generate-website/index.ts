import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── helpers ──

async function callAI(apiKey: string, model: string, messages: any[], tools?: any[], toolChoice?: any) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const body: any = { model, messages };
    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const status = res.status;
      const errText = await res.text();
      console.error("AI gateway error:", status, errText);
      throw Object.assign(new Error(`AI gateway error: ${status}`), { status });
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function generateImage(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const data = await callAI(apiKey, "google/gemini-2.5-flash-image", [
      { role: "user", content: prompt },
    ]);

    const images = data.choices?.[0]?.message?.images;
    if (images && images.length > 0) {
      return images[0].image_url?.url || null;
    }
    return null;
  } catch (e) {
    console.error("Image generation failed:", e);
    return null;
  }
}

async function uploadBase64Image(
  supabase: any,
  base64Url: string,
  websiteId: string,
  imageName: string
): Promise<string | null> {
  try {
    const base64Data = base64Url.split(",")[1];
    if (!base64Data) return null;

    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const path = `${websiteId}/${imageName}.png`;
    const { error } = await supabase.storage
      .from("website-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("website-images")
      .getPublicUrl(path);

    return publicUrl;
  } catch (e) {
    console.error("Upload failed:", e);
    return null;
  }
}

// ── tool schema for structured output ──

const websiteToolSchema = {
  type: "function",
  function: {
    name: "create_website",
    description: "Create a multi-page website with HTML, CSS, and JS for each page, plus image descriptions for generation.",
    parameters: {
      type: "object",
      properties: {
        pages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              slug: { type: "string", description: "URL slug: 'index' for home, 'about', 'services', 'contact'" },
              title: { type: "string", description: "Page title" },
              html: { type: "string", description: "Complete HTML for this page" },
              css: { type: "string", description: "CSS for this page" },
              js: { type: "string", description: "JavaScript for this page" },
            },
            required: ["slug", "title", "html", "css", "js"],
            additionalProperties: false,
          },
        },
        shared_css: { type: "string", description: "Shared CSS across all pages (reset, variables, nav, footer)" },
        shared_js: { type: "string", description: "Shared JS across all pages (nav toggle, smooth scroll)" },
        image_prompts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique ID used as img src placeholder like __IMG_hero__" },
              prompt: { type: "string", description: "Detailed prompt to generate this image" },
            },
            required: ["id", "prompt"],
            additionalProperties: false,
          },
        },
      },
      required: ["pages", "shared_css", "shared_js", "image_prompts"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { websiteId, model, pageSlug, customPrompt } = await req.json();
    if (!websiteId) throw new Error("Missing websiteId");

    const allowedModels = [
      "google/gemini-3-flash-preview",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-pro",
      "openai/gpt-5-mini",
      "openai/gpt-5",
    ];
    const selectedModel = allowedModels.includes(model) ? model : "google/gemini-3-flash-preview";

    // Fetch website record
    const { data: website, error: fetchError } = await supabase
      .from("websites")
      .select("*")
      .eq("id", websiteId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !website) throw new Error("Website not found");

    // ── Subscription enforcement ──
    const planLimits: Record<string, number> = { free: 1, starter: 1, business: 5, enterprise: Infinity };

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, expires_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentPlan = sub?.plan || "free";
    const limit = planLimits[currentPlan] ?? 1;

    if (sub?.expires_at && new Date(sub.expires_at) < new Date()) {
      await supabase.from("websites").update({ status: "failed" }).eq("id", websiteId);
      return new Response(
        JSON.stringify({ error: "Your subscription has expired. Please renew." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count } = await supabase
      .from("websites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("id", websiteId)
      .in("status", ["live", "generating"]);

    if ((count ?? 0) >= limit) {
      await supabase.from("websites").delete().eq("id", websiteId);
      return new Response(
        JSON.stringify({ error: `Your ${currentPlan} plan allows ${limit} website${limit > 1 ? "s" : ""}. Upgrade to create more.` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── SINGLE PAGE REGENERATION ──
    if (pageSlug) {
      // Fetch the existing page
      const { data: existingPage } = await supabase
        .from("website_pages")
        .select("*")
        .eq("website_id", websiteId)
        .eq("slug", pageSlug)
        .single();

      if (!existingPage) throw new Error(`Page '${pageSlug}' not found`);

      await supabase.from("websites").update({ status: "generating" }).eq("id", websiteId);

      const pageTypeDescriptions: Record<string, string> = {
        index: "Home page with: hero section, brief about, featured services, call-to-action",
        about: "About page with: company story, mission, team section",
        services: "Services page with: detailed service/product listings with descriptions",
        contact: "Contact page with: contact form (name, email, message), map placeholder, business info",
      };

      const singlePageSystemPrompt = `You are an expert web developer. Regenerate a SINGLE page for an existing multi-page website.

Generate ONLY the "${pageSlug}" page (slug: "${pageSlug}").
Page purpose: ${pageTypeDescriptions[pageSlug] || "A page appropriate for its slug/title"}.

Requirements:
- Semantic, accessible HTML5 with a consistent navigation bar linking all pages
- Navigation links should use anchors like: index.html, about.html, services.html, contact.html
- Mobile-first responsive CSS using the specified color scheme
- Complete HTML document with <!DOCTYPE html>
- SEO: Open Graph tags, semantic HTML, alt text on images, proper <title>

Image placeholders: Use __IMG_<id>__ as src. Provide 1-2 image prompts for this page.
Do NOT use external libraries or CDNs.`;

      const singlePageUserPrompt = `Regenerate the "${existingPage.title}" page for:
Business Name: ${website.name}
Industry: ${website.industry}
Description: ${website.description || "A professional business"}
Products/Services: ${website.services || "Various professional services"}
Target Audience: ${website.target_audience || "General public"}
Color Scheme: ${website.color_scheme || "Modern blue and white"}
Contact Email: ${website.contact_email || ""}
Phone: ${website.phone || ""}
Location: ${website.location || ""}

Make it fresh, modern, and reflect the ${website.industry} industry.${customPrompt ? `\n\nAdditional instructions from the user: ${customPrompt}` : ""}`;

      const singlePageToolSchema = {
        type: "function",
        function: {
          name: "create_page",
          description: "Create a single page with HTML, CSS, JS, and image prompts.",
          parameters: {
            type: "object",
            properties: {
              html: { type: "string", description: "Complete HTML for this page" },
              css: { type: "string", description: "CSS for this page (including shared styles)" },
              js: { type: "string", description: "JavaScript for this page" },
              image_prompts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    prompt: { type: "string" },
                  },
                  required: ["id", "prompt"],
                  additionalProperties: false,
                },
              },
            },
            required: ["html", "css", "js", "image_prompts"],
            additionalProperties: false,
          },
        },
      };

      let pageParsed: any;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const aiData = await callAI(
            LOVABLE_API_KEY,
            selectedModel,
            [
              { role: "system", content: singlePageSystemPrompt },
              { role: "user", content: singlePageUserPrompt },
            ],
            [singlePageToolSchema],
            { type: "function", function: { name: "create_page" } }
          );

          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            pageParsed = JSON.parse(toolCall.function.arguments);
            break;
          }
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            let clean = content.trim();
            if (clean.startsWith("```")) clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
            pageParsed = JSON.parse(clean);
            break;
          }
          throw new Error("No parseable response from AI");
        } catch (e: any) {
          if (e.status === 429 || e.status === 402) {
            await supabase.from("websites").update({ status: "live" }).eq("id", websiteId);
            return new Response(
              JSON.stringify({ error: e.status === 429 ? "Rate limited. Please try again later." : "AI credits exhausted." }),
              { status: e.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (attempt === 1) {
            await supabase.from("websites").update({ status: "live" }).eq("id", websiteId);
            throw new Error("Failed to regenerate page after retry");
          }
        }
      }

      // Generate images for this page
      const pageImagePrompts = pageParsed.image_prompts || [];
      const pageImageMap: Record<string, string> = {};
      await Promise.allSettled(
        pageImagePrompts.slice(0, 2).map(async (img: { id: string; prompt: string }) => {
          const base64 = await generateImage(LOVABLE_API_KEY, img.prompt);
          if (base64) {
            const publicUrl = await uploadBase64Image(supabase, base64, websiteId, img.id);
            if (publicUrl) pageImageMap[`__IMG_${img.id}__`] = publicUrl;
          }
        })
      );

      let finalHtml = pageParsed.html || "";
      for (const [ph, url] of Object.entries(pageImageMap)) finalHtml = finalHtml.replaceAll(ph, url);

      const finalCss = pageParsed.css || "";
      const finalJs = pageParsed.js || "";

      // Update the page
      await supabase
        .from("website_pages")
        .update({ generated_html: finalHtml, generated_css: finalCss, generated_js: finalJs })
        .eq("id", existingPage.id);

      // If index page, also update main website record
      if (pageSlug === "index") {
        await supabase.from("websites").update({
          generated_html: finalHtml, generated_css: finalCss, generated_js: finalJs, status: "live",
        }).eq("id", websiteId);
      } else {
        await supabase.from("websites").update({ status: "live" }).eq("id", websiteId);
      }

      return new Response(
        JSON.stringify({ success: true, pageSlug, images: Object.keys(pageImageMap).length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── FULL SITE REGENERATION (existing logic) ──
    // Update status to generating
    await supabase.from("websites").update({ status: "generating" }).eq("id", websiteId);

    // ── AI prompt ──
    const systemPrompt = `You are an expert web developer. Generate a complete, modern, multi-page responsive website for a business.

Pages to generate: Home (slug: "index"), About (slug: "about"), Services (slug: "services"), Contact (slug: "contact").

Requirements for each page:
- Semantic, accessible HTML5 with a consistent navigation bar linking all pages
- Navigation links should use anchors like: index.html, about.html, services.html, contact.html
- Each page should have its own specific content appropriate to its purpose
- Mobile-first responsive CSS using the specified color scheme
- The Home page should have: hero section, brief about, featured services, call-to-action
- The About page: company story, mission, team section
- The Services page: detailed service/product listings with descriptions
- The Contact page: contact form (name, email, message), map placeholder, business info

shared_css: Include CSS reset, CSS variables for colors, nav styles, footer styles, responsive utilities.
shared_js: Include mobile nav toggle, smooth scrolling, form validation on contact page.

Image placeholders: Use __IMG_<id>__ as src attributes for images (e.g. <img src="__IMG_hero__">). Provide descriptive prompts in image_prompts for each placeholder. Generate 2-4 image prompts for key visuals (hero, about, services).

SEO: Include Open Graph tags, Twitter cards, canonical links, JSON-LD (LocalBusiness), semantic HTML, alt text on images, proper <title> tags.

Do NOT use external libraries or CDNs. Each page's HTML should be a complete document with <!DOCTYPE html>.`;

    const userPrompt = `Create a website for:
Business Name: ${website.name}
Industry: ${website.industry}
Description: ${website.description || "A professional business"}
Products/Services: ${website.services || "Various professional services"}
Target Audience: ${website.target_audience || "General public"}
Color Scheme: ${website.color_scheme || "Modern blue and white"}
Contact Email: ${website.contact_email || ""}
Phone: ${website.phone || ""}
Location: ${website.location || ""}

Make it reflect the ${website.industry} industry with appropriate tone and professionalism.`;

    // Call AI with tool calling for structured output (with retry)
    let parsed: any;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const aiData = await callAI(
          LOVABLE_API_KEY,
          selectedModel,
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          [websiteToolSchema],
          { type: "function", function: { name: "create_website" } }
        );

        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          parsed = JSON.parse(toolCall.function.arguments);
          break;
        }

        // Fallback: try parsing message content as JSON
        const content = aiData.choices?.[0]?.message?.content;
        if (content) {
          let clean = content.trim();
          if (clean.startsWith("```")) {
            clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          }
          parsed = JSON.parse(clean);
          break;
        }

        throw new Error("No parseable response from AI");
      } catch (e: any) {
        if (e.status === 429 || e.status === 402) {
          await supabase.from("websites").update({ status: "failed" }).eq("id", websiteId);
          return new Response(
            JSON.stringify({ error: e.status === 429 ? "Rate limited. Please try again later." : "AI credits exhausted." }),
            { status: e.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (attempt === 1) {
          console.error("AI generation failed after retry:", e);
          await supabase.from("websites").update({ status: "failed" }).eq("id", websiteId);
          throw new Error("Failed to generate website after retry");
        }
        console.warn("Attempt", attempt + 1, "failed, retrying...", e.message);
      }
    }

    // ── Generate images and replace placeholders ──
    const imagePrompts = parsed.image_prompts || [];
    const imageMap: Record<string, string> = {};

    // Generate images in parallel (max 4)
    const imageResults = await Promise.allSettled(
      imagePrompts.slice(0, 4).map(async (img: { id: string; prompt: string }) => {
        const base64 = await generateImage(LOVABLE_API_KEY, img.prompt);
        if (base64) {
          const publicUrl = await uploadBase64Image(supabase, base64, websiteId, img.id);
          if (publicUrl) {
            imageMap[`__IMG_${img.id}__`] = publicUrl;
          }
        }
      })
    );

    // Replace image placeholders in all page HTML
    const replaceImages = (html: string) => {
      let result = html;
      for (const [placeholder, url] of Object.entries(imageMap)) {
        result = result.replaceAll(placeholder, url);
      }
      return result;
    };

    const pages = parsed.pages || [];
    const sharedCss = parsed.shared_css || "";
    const sharedJs = parsed.shared_js || "";

    // Use the first page (index) as the "main" website content for backward compat
    const indexPage = pages.find((p: any) => p.slug === "index") || pages[0];
    const mainHtml = indexPage ? replaceImages(indexPage.html) : "";
    const mainCss = sharedCss + "\n" + (indexPage?.css || "");
    const mainJs = sharedJs + "\n" + (indexPage?.js || "");

    // ── Save version history ──
    const { data: latestVersion } = await supabase
      .from("website_versions")
      .select("version_number")
      .eq("website_id", websiteId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latestVersion?.version_number || 0) + 1;

    const pagesForVersion = pages.map((p: any) => ({
      slug: p.slug,
      title: p.title,
      html: replaceImages(p.html),
      css: p.css,
      js: p.js,
    }));

    await supabase.from("website_versions").insert({
      website_id: websiteId,
      version_number: nextVersion,
      generated_html: mainHtml,
      generated_css: mainCss,
      generated_js: mainJs,
      pages: pagesForVersion,
      model_used: selectedModel,
    });

    // ── Save pages to website_pages table ──
    // Delete old pages first
    await supabase.from("website_pages").delete().eq("website_id", websiteId);

    // Insert new pages
    const pageInserts = pages.map((p: any, i: number) => ({
      website_id: websiteId,
      slug: p.slug,
      title: p.title,
      generated_html: replaceImages(p.html),
      generated_css: sharedCss + "\n" + (p.css || ""),
      generated_js: sharedJs + "\n" + (p.js || ""),
      sort_order: i,
    }));

    if (pageInserts.length > 0) {
      await supabase.from("website_pages").insert(pageInserts);
    }

    // ── Update main website record ──
    const { error: updateError } = await supabase
      .from("websites")
      .update({
        generated_html: mainHtml,
        generated_css: mainCss,
        generated_js: mainJs,
        status: "live",
      })
      .eq("id", websiteId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to save generated website");
    }

    return new Response(
      JSON.stringify({ success: true, version: nextVersion, pages: pages.length, images: Object.keys(imageMap).length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-website error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
