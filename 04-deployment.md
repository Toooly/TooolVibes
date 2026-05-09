# 04 - Deployment Notes

## Purpose

This file stores deployment-related context for InfoToolvibes / ControoTool / ControoVibes.

The exact hosting provider may change over time, so OpenCode must inspect current repo configuration before assuming deployment behavior.

---

## Possible hosting environments

The project may involve or have involved:

- Cloudflare Workers
- Cloudflare Pages
- Vercel
- Netlify
- custom domains
- `workers.dev` preview domains
- Register.it DNS records
- subdomains connected through CNAME or platform-specific custom domain configuration

Always verify the current active deployment path.

---

## Important deployment principles

- Do not assume Node filesystem write access in serverless environments.
- Do not use local JSON files as writable databases in production serverless hosts.
- Do not hardcode preview URLs if a production custom domain is configured.
- Do not break environment variable names without documenting migration.
- Do not change output/adapter mode blindly.
- Do not add dependencies that exceed host bundle limits without checking.
- Do not assume local dev behavior equals production behavior.

---

## Environment variables

Before touching environment logic, inspect current usage.

Common variables may include:

- public app URL
- API URLs
- third-party tokens
- analytics keys
- deployment-specific config
- integration secrets

Rules:

- Never commit real secrets.
- Do not print secrets in logs.
- Keep public variables separate from private variables.
- Update documentation if variable names change.
- Verify all required variables are listed somewhere safe.

---

## Cloudflare-specific risks

If the project is deployed to Cloudflare Workers or Pages:

Check for:

- bundle size limits
- unsupported Node APIs
- filesystem write attempts
- edge runtime compatibility
- environment binding configuration
- custom domain routing
- DNS records
- preview URL versus production URL mismatch
- API route compatibility

Do not assume a Next.js/Vite/React app behaves the same on Cloudflare as on Vercel.

---

## Vercel-specific risks

If deployed to Vercel:

Check for:

- read-only filesystem in serverless functions
- API route runtime
- environment variables
- build command
- output directory
- framework detection
- edge/serverless runtime differences

Writable runtime files should not be used as persistent storage.

---

## Netlify-specific risks

If deployed to Netlify:

Check for:

- build command
- publish directory
- serverless functions directory
- environment variables
- redirects
- edge functions compatibility
- plugin requirements

---

## DNS/custom domain rules

For custom domains:

- Verify whether DNS is managed at Register.it, Cloudflare, or another provider.
- Do not move DNS authority without knowing all existing records.
- If only a subdomain is needed, prefer a precise CNAME/required record instead of migrating the whole zone.
- Preserve existing records for Shopify, chat widgets, email, verification records, and other services.
- Do not delete unknown DNS records.

---

## Deployment acceptance criteria

A deployment-related task is not complete until:

1. Build command is identified.
2. Host target is identified.
3. Relevant environment variables are listed.
4. Runtime limitations are checked.
5. Any changed config is documented.
6. Risk of breaking production is explained.
