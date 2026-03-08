import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const subdomain = url.searchParams.get("subdomain");

  if (!subdomain) {
    return new Response("<h1>404 — No subdomain specified</h1>", {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: website, error } = await supabase
      .from("websites")
      .select("name, description, industry, generated_html, generated_css, generated_js, status")
      .eq("subdomain", subdomain)
      .eq("status", "live")
      .single();

    if (error || !website) {
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not Found</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1>Site Not Found</h1><p>No website exists at <strong>${subdomain}.ugbiz.com</strong></p></div></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // If generated_html is a full document, serve it directly with CSS/JS injected
    let fullHtml: string;
    const html = website.generated_html || "";
    
    if (html.trim().toLowerCase().startsWith("<!doctype") || html.trim().toLowerCase().startsWith("<html")) {
      // Full document — inject CSS and JS into it
      fullHtml = html
        .replace("</head>", `<style>${website.generated_css || ""}</style></head>`)
        .replace("</body>", `<script>${website.generated_js || ""}</script></body>`);
    } else {
      // Partial HTML — wrap it
      fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${website.name}</title>
  <style>${website.generated_css || ""}</style>
</head>
<body>
${html}
<script>${website.generated_js || ""}</script>
</body>
</html>`;
    }

    return new Response(fullHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e) {
    console.error("serve-website error:", e);
    return new Response("<h1>500 — Server Error</h1>", {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
