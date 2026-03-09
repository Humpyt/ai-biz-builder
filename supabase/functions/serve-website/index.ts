import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_DOMAIN = (Deno.env.get("APP_DOMAIN") || "").toLowerCase();
const SITES_DOMAIN = (Deno.env.get("SITES_DOMAIN") || "").toLowerCase();
const RESERVED_SUBDOMAINS = new Set(["api", "studio", "coolify", "www"]);

function normalizeHost(host: string | null): string {
  return (host || "").split(":")[0].trim().toLowerCase();
}

function extractSubdomain(req: Request, url: URL): string | null {
  const querySubdomain = url.searchParams.get("subdomain");
  if (querySubdomain) {
    return querySubdomain.trim().toLowerCase();
  }

  const forwardedHost = normalizeHost(req.headers.get("x-forwarded-host"));
  const requestHost = normalizeHost(req.headers.get("host"));
  const host = forwardedHost || requestHost || normalizeHost(url.hostname);

  if (!host) {
    return null;
  }

  if (SITES_DOMAIN && host.endsWith(`.${SITES_DOMAIN}`)) {
    return host.slice(0, -(SITES_DOMAIN.length + 1));
  }

  if (APP_DOMAIN && host.endsWith(`.${APP_DOMAIN}`) && host !== APP_DOMAIN) {
    const candidate = host.slice(0, -(APP_DOMAIN.length + 1));
    if (!RESERVED_SUBDOMAINS.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractPageSlug(url: URL): string {
  const queryPage = url.searchParams.get("page");
  if (queryPage) {
    return queryPage.replace(/^\//, "").replace(/\.html$/, "") || "index";
  }

  const normalizedPath = url.pathname
    .replace(/^\/functions\/v1\/serve-website/, "")
    .replace(/^\/+|\/+$/g, "");

  if (!normalizedPath) {
    return "index";
  }

  return normalizedPath.replace(/\.html$/, "") || "index";
}

function getSiteHost(subdomain: string): string {
  if (SITES_DOMAIN) {
    return `${subdomain}.${SITES_DOMAIN}`;
  }

  if (APP_DOMAIN) {
    return `${subdomain}.${APP_DOMAIN}`;
  }

  return subdomain;
}

function buildPageHref(subdomain: string, slug: string, hostBasedRouting: boolean): string {
  const normalizedSlug = slug.toLowerCase();

  if (hostBasedRouting) {
    return normalizedSlug === "index" ? "/" : `/${normalizedSlug}`;
  }

  return normalizedSlug === "index"
    ? `?subdomain=${subdomain}&page=index`
    : `?subdomain=${subdomain}&page=${normalizedSlug}`;
}

function buildChatWidget(websiteId: string, businessName: string): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const safeName = businessName.replace(/'/g, "\\'").replace(/"/g, "&quot;");
  return `
<div id="ugbiz-chat-widget">
<style>
#ugbiz-chat-toggle{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:#2563eb;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,.4);z-index:99999;display:flex;align-items:center;justify-content:center;transition:transform .2s}
#ugbiz-chat-toggle:hover{transform:scale(1.1)}
#ugbiz-chat-toggle svg{width:28px;height:28px;fill:currentColor}
#ugbiz-chat-box{position:fixed;bottom:88px;right:20px;width:370px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 120px);border-radius:16px;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,.18);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,sans-serif}
#ugbiz-chat-box.open{display:flex}
#ugbiz-chat-header{background:#2563eb;color:#fff;padding:14px 16px;font-weight:600;font-size:15px;display:flex;align-items:center;justify-content:space-between}
#ugbiz-chat-header button{background:none;border:none;color:#fff;cursor:pointer;font-size:20px;line-height:1;padding:0 4px}
#ugbiz-chat-messages{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.ugbiz-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5;word-wrap:break-word}
.ugbiz-msg.assistant{background:#f1f5f9;color:#1e293b;align-self:flex-start;border-bottom-left-radius:4px}
.ugbiz-msg.user{background:#2563eb;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.ugbiz-msg.typing{background:#f1f5f9;align-self:flex-start;border-bottom-left-radius:4px;color:#94a3b8}
#ugbiz-chat-input-area{border-top:1px solid #e2e8f0;padding:10px 12px;display:flex;gap:8px;align-items:center}
#ugbiz-chat-input{flex:1;border:1px solid #e2e8f0;border-radius:24px;padding:8px 14px;font-size:14px;outline:none;font-family:inherit;resize:none;max-height:80px;line-height:1.4}
#ugbiz-chat-input:focus{border-color:#2563eb}
#ugbiz-chat-send{width:36px;height:36px;border-radius:50%;background:#2563eb;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
#ugbiz-chat-send:disabled{opacity:.5;cursor:not-allowed}
#ugbiz-chat-send svg{width:18px;height:18px;fill:currentColor}
</style>
<button id="ugbiz-chat-toggle" aria-label="Chat with us">
<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
</button>
<div id="ugbiz-chat-box">
<div id="ugbiz-chat-header">
<span>Chat with ${safeName}</span>
<button onclick="document.getElementById('ugbiz-chat-box').classList.remove('open')" aria-label="Close">&#10005;</button>
</div>
<div id="ugbiz-chat-messages">
<div class="ugbiz-msg assistant">Hi! I'm the AI assistant for ${safeName}. How can I help you today?</div>
</div>
<div id="ugbiz-chat-input-area">
<input id="ugbiz-chat-input" type="text" placeholder="Type a message..." autocomplete="off">
<button id="ugbiz-chat-send" aria-label="Send">
<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
</button>
</div>
</div>
<script>
(function(){
  var toggle=document.getElementById("ugbiz-chat-toggle");
  var box=document.getElementById("ugbiz-chat-box");
  var input=document.getElementById("ugbiz-chat-input");
  var sendBtn=document.getElementById("ugbiz-chat-send");
  var msgs=document.getElementById("ugbiz-chat-messages");
  var history=[];
  var sending=false;
  toggle.onclick=function(){box.classList.toggle("open");if(box.classList.contains("open"))input.focus()};
  function addMsg(role,text){var d=document.createElement("div");d.className="ugbiz-msg "+role;d.textContent=text;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;return d}
  function doSend(){
    var text=input.value.trim();if(!text||sending)return;
    sending=true;sendBtn.disabled=true;input.value="";
    addMsg("user",text);history.push({role:"user",content:text});
    var typing=addMsg("typing","Thinking...");
    fetch("${supabaseUrl}/functions/v1/chat-widget",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({websiteId:"${websiteId}",messages:history})})
    .then(function(r){return r.json()})
    .then(function(d){msgs.removeChild(typing);var reply=d.reply||d.error||"Sorry, something went wrong.";addMsg("assistant",reply);history.push({role:"assistant",content:reply})})
    .catch(function(){msgs.removeChild(typing);addMsg("assistant","Sorry, I could not connect. Please try again.")})
    .finally(function(){sending=false;sendBtn.disabled=false;input.focus()});
  }
  sendBtn.onclick=doSend;
  input.onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();doSend()}};
})();
</script>
</div>`;
}

serve(async (req) => {
  const url = new URL(req.url);
  const subdomain = extractSubdomain(req, url);
  const slug = extractPageSlug(url);
  const hostBasedRouting = !url.searchParams.get("subdomain");

  if (!subdomain) {
    return new Response("<h1>404 - No subdomain specified</h1>", {
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
      .select("id, name, description, industry, generated_html, generated_css, generated_js, status, chat_widget_enabled")
      .eq("subdomain", subdomain)
      .eq("status", "live")
      .single();

    if (error || !website) {
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not Found</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1>Site Not Found</h1><p>No website exists at <strong>${getSiteHost(subdomain)}</strong></p></div></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Try to find the specific page
    let html = "";
    let css = "";
    let js = "";

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
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Page Not Found - ${website.name}</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1>Page Not Found</h1><p>This page doesn't exist on ${website.name}.</p><a href="${buildPageHref(subdomain, "index", hostBasedRouting)}">Go to Home</a></div></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Rewrite internal page links for either host-based or query-based routing
    html = html.replace(
      /href=["'](index|about|services|contact)\.html["']/gi,
      (_, pageName) => `href="${buildPageHref(subdomain, pageName.toLowerCase(), hostBasedRouting)}"`
    );

    const seoTitle = pageData?.title || website.name;
    const seoDesc = (website.description || `${website.name} - a professional ${website.industry} business`).replace(/"/g, '&quot;');
    const seoMeta = `
  <meta name="description" content="${seoDesc}">
  <meta property="og:title" content="${seoTitle.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${seoDesc}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${seoTitle.replace(/"/g, '&quot;')}">
  <meta name="twitter:description" content="${seoDesc}">`;

    // Chat widget code (only if enabled)
    const chatWidgetCode = website.chat_widget_enabled !== false ? buildChatWidget(website.id, website.name) : "";

    let fullHtml: string;

    if (html.trim().toLowerCase().startsWith("<!doctype") || html.trim().toLowerCase().startsWith("<html")) {
      fullHtml = html
        .replace("</head>", `${seoMeta}\n<style>${css}</style></head>`)
        .replace("</body>", `<script>${js}</script>${chatWidgetCode}</body>`);
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
${chatWidgetCode}
</body>
</html>`;
    }

    // Track page view (fire-and-forget, don't block response)
    const visitorIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                      req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";

    // Insert page view then try to resolve country async
    supabase.from("page_views").insert({
      website_id: website.id,
      page_slug: slug,
      visitor_ip: visitorIp,
      user_agent: userAgent,
      referer: referer,
    }).then(async ({ data: insertData, error: pvError }) => {
      if (pvError) {
        console.error("Page view tracking error:", pvError);
        return;
      }
      // Resolve country from IP (best-effort, don't fail)
      if (visitorIp && visitorIp !== "unknown") {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${visitorIp}?fields=country`, { signal: AbortSignal.timeout(3000) });
          if (geoRes.ok) {
            const geo = await geoRes.json();
            if (geo.country) {
              await supabase.from("page_views")
                .update({ country: geo.country })
                .eq("website_id", website.id)
                .eq("page_slug", slug)
                .eq("visitor_ip", visitorIp)
                .is("country", null)
                .order("viewed_at", { ascending: false })
                .limit(1);
            }
          }
        } catch { /* ignore geo lookup failures */ }
      }
    });

    return new Response(fullHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e) {
    console.error("serve-website error:", e);
    return new Response("<h1>500 - Server Error</h1>", {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
