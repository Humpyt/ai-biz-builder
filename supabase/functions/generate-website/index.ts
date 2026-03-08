import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { websiteId, model } = await req.json();
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

    // Update status to generating
    await supabase
      .from("websites")
      .update({ status: "generating" })
      .eq("id", websiteId);

    const systemPrompt = `You are an expert web developer. Generate a complete, modern, responsive single-page website for a business. Return ONLY valid JSON with three keys: "html", "css", and "js".

Requirements:
- The HTML should be semantic, accessible, and include all sections: hero/header, about, services/products, contact, and footer
- The CSS should be modern, responsive (mobile-first), and use the specified color scheme
- The JS should handle mobile menu toggle, smooth scrolling, and any interactive elements
- Include proper meta tags, viewport settings
- Make it visually stunning and professional
- Use the business information provided to fill in real content
- Do NOT use any external libraries or CDNs
- The HTML should be a complete document with <!DOCTYPE html>

IMPORTANT: Return ONLY a JSON object like {"html": "...", "css": "...", "js": "..."} with no markdown formatting, no code blocks, no explanation.`;

    const userPrompt = `Create a website for this business:

Business Name: ${website.name}
Industry: ${website.industry}
Description: ${website.description || "A professional business"}
Products/Services: ${website.services || "Various professional services"}
Target Audience: ${website.target_audience || "General public"}
Color Scheme: ${website.color_scheme || "Modern blue and white"}
Contact Email: ${website.contact_email || ""}
Phone: ${website.phone || ""}
Location: ${website.location || ""}

Make the website reflect the ${website.industry} industry with appropriate imagery descriptions, icons, and professional tone.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        await supabase.from("websites").update({ status: "failed" }).eq("id", websiteId);
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        await supabase.from("websites").update({ status: "failed" }).eq("id", websiteId);
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      await supabase.from("websites").update({ status: "failed" }).eq("id", websiteId);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      await supabase.from("websites").update({ status: "failed" }).eq("id", websiteId);
      throw new Error("No content from AI");
    }

    // Parse the JSON response - handle potential markdown wrapping
    let parsed;
    try {
      let cleanContent = content.trim();
      // Remove markdown code blocks if present
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      await supabase.from("websites").update({ status: "failed" }).eq("id", websiteId);
      throw new Error("Failed to parse AI-generated website code");
    }

    // Update website with generated code
    const { error: updateError } = await supabase
      .from("websites")
      .update({
        generated_html: parsed.html || "",
        generated_css: parsed.css || "",
        generated_js: parsed.js || "",
        status: "live",
      })
      .eq("id", websiteId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to save generated website");
    }

    return new Response(
      JSON.stringify({ success: true }),
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
