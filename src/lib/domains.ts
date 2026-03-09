const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getHostFromUrl = (value: string) => {
  try {
    return new URL(value).hostname;
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
};

const localFallbackOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5174";

export const appUrl = trimTrailingSlash(import.meta.env.VITE_APP_URL || localFallbackOrigin);
export const appDomain = getHostFromUrl(appUrl);
export const sitesDomain = import.meta.env.VITE_SITES_DOMAIN || `sites.${appDomain}`;

const isLocalDomain = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");

export const getPublicSiteHost = (subdomain: string) =>
  `${subdomain}.${sitesDomain}`;

export const getPublicSiteUrl = (subdomain: string, page = "index") => {
  const normalizedPage = page.replace(/^\//, "").replace(/\.html$/, "") || "index";

  if (!isLocalDomain(appDomain) || import.meta.env.VITE_SITES_DOMAIN) {
    return normalizedPage === "index"
      ? `https://${getPublicSiteHost(subdomain)}`
      : `https://${getPublicSiteHost(subdomain)}/${normalizedPage}`;
  }

  const fallback = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serve-website`);
  fallback.searchParams.set("subdomain", subdomain);
  if (normalizedPage !== "index") {
    fallback.searchParams.set("page", normalizedPage);
  }
  return fallback.toString();
};
