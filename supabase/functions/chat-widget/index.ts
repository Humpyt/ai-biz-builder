import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteId, messages } = await req.json();
    if (!websiteId || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing websiteId or messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch website info + all pages for context
    const { data: website, error: wErr } = await supabase
      .from("websites")
      .select("name, industry, description, services, target_audience, contact_email, phone, location")
      .eq("id", websiteId)
      .single();

    if (wErr || !website) {
      return new Response(
        JSON.stringify({ error: "Website not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch page content for richer context (strip HTML tags for text)
    const { data: pages } = await supabase
      .from("website_pages")
      .select("slug, title, generated_html")
      .eq("website_id", websiteId)
      .order("sort_order");

    const stripHtml = (html: string) =>
      html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);

    const pageContext = (pages || [])
      .map((p) => `--- ${p.title} (${p.slug}) ---\n${stripHtml(p.generated_html || "")}`)
      .join("\n\n");

    const systemPrompt = `You are a helpful AI assistant for "${website.name}", a ${website.industry} business.

Business Info:
- Description: ${website.description || "N/A"}
- Products/Services: ${website.services || "N/A"}
- Target Audience: ${website.target_audience || "N/A"}
- Contact Email: ${website.contact_email || "N/A"}
- Phone: ${website.phone || "N/A"}
- Location: ${website.location || "N/A"}

Website Content:
${pageContext}

Rules:
- Answer visitor questions about the business based on the info above.
- Be friendly, helpful, and concise (2-3 sentences max unless more detail is needed).
- If you don't know something, say so and suggest contacting the business directly.
- Never make up information not present in the business details above.
- Respond in the same language as the visitor's message.`;

    // Limit conversation history to last 10 messages
    const recentMessages = messages.slice(-10);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages,
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Please try again.";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("chat-widget error:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
