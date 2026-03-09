# UgBiz Handover

Baseline:
- Branch: `main`
- Commit: `885d74c`
- Repository: `Humpyt/ai-biz-builder`

Objective:
- Host the frontend at `ugbiz.tech`
- Self-host Supabase on Coolify
- Expose the following domains:
  - `ugbiz.tech`
  - `coolify.ugbiz.tech`
  - `api.ugbiz.tech`
  - `studio.ugbiz.tech`
  - `*.sites.ugbiz.tech`

## Current State

This repo has already been prepared for self-hosted deployment:
- Native Supabase OAuth is used by the app runtime
- Frontend domains are env-driven
- Tenant site URLs are env-driven
- `serve-website` supports host-based tenant resolution with query fallback for local development
- Frontend build passes
- Frontend tests pass

Important:
- AI generation and chat still depend on `LOVABLE_API_KEY` and Lovable's AI gateway
- Wildcard tenant routing still requires deployment-side proxy/routing setup

## Key Files

Deployment-related frontend files:
- `src/lib/domains.ts`
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/admin/AdminWebsites.tsx`
- `src/pages/Onboarding.tsx`
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/FeaturesSection.tsx`
- `src/components/landing/PricingSection.tsx`
- `src/vite-env.d.ts`
- `.env.example`

Backend / edge function files:
- `supabase/functions/serve-website/index.ts`
- `supabase/functions/generate-website/index.ts`
- `supabase/functions/chat-widget/index.ts`
- `supabase/migrations/*`

## DNS

All of these should point to the VPS public IP:

```text
A   @         <VPS_IP>
A   coolify   <VPS_IP>
A   api       <VPS_IP>
A   studio    <VPS_IP>
A   *.sites   <VPS_IP>
```

This gives:
- `ugbiz.tech`
- `coolify.ugbiz.tech`
- `api.ugbiz.tech`
- `studio.ugbiz.tech`
- `anything.sites.ugbiz.tech`

## VPS / Platform Plan

Recommended minimum VPS:
- 4 vCPU
- 8 GB RAM
- 80+ GB SSD

Install:
1. Docker
2. Coolify
3. Self-hosted Supabase through Coolify

## Frontend Deployment

Deploy this repo in Coolify as a static app.

Suggested settings:
- Build pack: `Nixpacks`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Domain: `ugbiz.tech`

Frontend env vars:

```env
VITE_SUPABASE_URL=https://api.ugbiz.tech
VITE_SUPABASE_PUBLISHABLE_KEY=<SUPABASE_ANON_KEY>
VITE_APP_URL=https://ugbiz.tech
VITE_SITES_DOMAIN=sites.ugbiz.tech
```

## Supabase Deployment

Self-host Supabase behind:
- `api.ugbiz.tech`
- `studio.ugbiz.tech`

Required deployment env/config:

```env
API_EXTERNAL_URL=https://api.ugbiz.tech
APP_DOMAIN=ugbiz.tech
SITES_DOMAIN=sites.ugbiz.tech
SUPABASE_URL=https://api.ugbiz.tech
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
LOVABLE_API_KEY=<REQUIRED_IF_KEEPING_CURRENT_AI_FLOW>
```

Also configure:
- SMTP for signup confirmation and password reset
- Google OAuth in Supabase Auth if Google login is required
- persistent volumes for Postgres and storage
- backups

## Database And Edge Functions

Required actions:
1. Bring up self-hosted Supabase
2. Apply all migrations from `supabase/migrations`
3. Deploy edge functions:
   - `generate-website`
   - `serve-website`
   - `chat-widget`

## Wildcard Tenant Routing

This is critical.

Customer websites are intended to resolve on:
- `https://<subdomain>.sites.ugbiz.tech`

The `serve-website` function now supports tenant resolution from:
- `X-Forwarded-Host`
- `Host`

That means wildcard traffic must be routed to the `serve-website` function while preserving the original host header.

If this is not configured, tenant websites will not work in production.

## Auth

The app now uses native Supabase OAuth in:
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`

In self-hosted Supabase Auth, configure:
- Site URL: `https://ugbiz.tech`
- Redirect URLs for production and local development
- Google OAuth credentials if Google sign-in is enabled

## Smoke Test Checklist

Do not sign off deployment until all of these pass:

1. Open `https://ugbiz.tech`
2. Sign up with email
3. Confirm email
4. Log in
5. Log in with Google
6. Create a website
7. Wait for generation to complete
8. Open the website from dashboard
9. Verify it resolves at `https://<subdomain>.sites.ugbiz.tech`
10. Edit website content
11. Regenerate full website
12. Regenerate a single page
13. Restore a previous version
14. Verify analytics records page views
15. Verify chat widget works
16. Verify admin routes work for admin users
17. Verify password reset works
18. Verify generated/uploaded images load publicly

## Known Caveat

The current AI flow is still tied to Lovable's AI gateway.

If the goal is to remove Lovable completely, these functions must be rewritten:
- `supabase/functions/generate-website/index.ts`
- `supabase/functions/chat-widget/index.ts`

## Local Development

Use `.env.example` as the deployment template.

Local query-based fallback for tenant site serving still exists for development through:
- `serve-website?subdomain=<subdomain>&page=<page>`
