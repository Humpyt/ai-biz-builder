import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const subdomain = url.searchParams.get("subdomain");
  const page = url.searchParams.get("page") || "index";

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

    // Fetch the website
    const { data: website, error } = await supabase
      .from("websites")
      .select("id, name, description, industry, generated_html, generated_css, generated_js, status")
      .eq("subdomain", subdomain)
      .eq("status", "live")
      .single();

    if (error || !website) {
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not Found</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1>Site Not Found</h1><p>No website exists at <strong>${subdomain}.ugbiz.com</strong></p></div></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Try to find the specific page
    let html = "";
    let css = "";
    let js = "";

    const slug = page.replace(/\.html$/, "") || "index";

    const { data: pageData } = await supabase
      .from("website_pages")
      .select("title, generated_html, generated_css, generated_js")
      .eq("website_id", website.id)
      .eq("slug", slug)
      .single();

    if (pageData) {
      html = pageData.generated_html || "";
      css = pageData.generated_css || "";
      js = pageData.generated_js || "";
    } else if (slug === "index") {
      // Fallback to main website fields for backward compatibility
      html = website.generated_html || "";
      css = website.generated_css || "";
      js = website.generated_js || "";
    } else {
      // Page not found - show 404 within the site
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Page Not Found - ${website.name}</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1>Page Not Found</h1><p>This page doesn't exist on ${website.name}.</p><a href="?subdomain=${subdomain}&page=index">Go to Home</a></div></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Rewrite internal page links to use query params
    // Transform href="about.html" -> href="?subdomain=X&page=about"
    html = html.replace(
      /href=["'](index|about|services|contact)\.html["']/gi,
      (_, pageName) => `href="?subdomain=${subdomain}&page=${pageName.toLowerCase()}"`
    );

    const seoTitle = pageData?.title || website.name;
    const seoDesc = (website.description || `${website.name} — a professional ${website.industry} business`).replace(/"/g, '&quot;');
    const seoMeta = `
  <meta name="description" content="${seoDesc}">
  <meta property="og:title" content="${seoTitle.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${seoDesc}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${seoTitle.replace(/"/g, '&quot;')}">
  <meta name="twitter:description" content="${seoDesc}">`;

    let fullHtml: string;

    if (html.trim().toLowerCase().startsWith("<!doctype") || html.trim().toLowerCase().startsWith("<html")) {
      fullHtml = html
        .replace("</head>", `${seoMeta}\n<style>${css}</style></head>`)
        .replace("</body>", `<script>${js}</script></body>`);
    } else {
      fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${seoTitle}</title>${seoMeta}
  <style>${css}</style>
</head>
<body>
${html}
<script>${js}</script>
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
