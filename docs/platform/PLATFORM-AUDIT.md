# TooolVibes — Platform Audit (2026-09-30, main)

Source-of-truth snapshot before the cross-platform foundation work.
Verified from `package.json`, `app/layout.tsx`, `middleware.ts`, `app/api/*`,
`lib/auth/*`, `lib/haptics/*`, `wrangler.jsonc`, `next.config.ts`.

## 1. Rendering / framework

- Next.js 15.5.22, App Router, React 19, Node engine 22.23.1.
- Server Components by default; 215 `"use client"` modules for interactive islands
  (nav, dock, workspace, tool detail actions, TOC/spy, 3D background).
- `generateStaticParams` in 4 routes (marketing/tool/guide pre-render);
  the app is NOT a static export (`output` is default; dynamic workspace,
  auth, API routes, middleware all active).
- Middleware: root `middleware.ts` (security/browser headers;
  `__tests__/lib/security/browser-headers.test.ts`).
- Deployment: Cloudflare Workers via OpenNext
  (`wrangler.jsonc` main `.open-next/worker.js`, `nodejs_compat`).
  Remote-first: `NEXT_PUBLIC_SITE_URL=https://tooolvibes.eu`.

## 2. Data / auth / session

- Supabase `@supabase/ssr@0.10.2` + `@supabase/supabase-js@2.57.4`.
- Cookie-based sessions (`cookies()` in 5 server modules;
  `createServerClient` in `lib/supabase/*`).
- Auth paths: magic link (`verifyOtp` token_hash/type), OAuth PKCE
  (`exchangeCodeForSession`), legacy hash tokens (`setSession`) —
  unified in `lib/auth/complete-auth-callback.ts`.
- Redirect origins allow-listed (`ALLOWED_AUTH_ORIGINS`,
  `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN=https://tooolvibes.eu`).
- 18 API route groups under `app/api` (auth, workspace-account,
  workspace-state, discovery, community, sponsors, tools, release...).
- Guest→account merge is union-first + idempotent (`operation_id`);
  `clearedAt` pinned so guest clears cannot delete account data.

## 3. PWA / installability (as-found)

- NO web app manifest (`public/manifest*` absent).
- NO service worker, NO workbox, NO `beforeinstallprompt` handling.
- Icons: metadata only (`/brand/tooolvibes-logo.png` for icon/shortcut/
  apple-touch). No maskable icon set, no 192/512 PNG set.
- `viewportFit: cover` + `interactiveWidget: resizes-content` are set
  (`app/layout.tsx`), so safe-area + Android keyboard resize are ready;
  installability is the gap, not viewport.

## 4. Push / downloads / external URLs

- No Web Push subscription path (no VAPID, no push routes).
- No download flows in product scope.
- External tool links: plain `<a target="_blank" rel="noopener noreferrer">`;
  affiliate links add `rel="sponsored"` (`tool-detail-action-surface.tsx:86-95`).
  Affiliate tracking is URL-side, preserved by never intercepting clicks.
  Native shell MUST open these in the system browser, not a trapped webview.

## 5. Deep routes (canonical, must keep working)

- `/toools/<slug>`, `/posts/<slug>`, `/collections/<slug>`, `/archivio`,
  `/account?view=riprendi|salvati|stack|decisioni`, `/compare`, `/radar`,
  `/shortlist`, `/tags`. All plain App Router paths — deep-link safe by
  construction on web; native must map Universal/App Links to the same paths.

## 6. Environment / secrets

- Public: Supabase URL + publishable anon key, Turnstile site key, site URL.
- Secret surface (server/CI only): Supabase service key, Resend key,
  Turnstile secret, Cloudflare account/token. Nothing secret is committed
  (`wrangler.jsonc` holds public vars only; account_id is not a secret).

## 7. Capacitor feasibility gate — DECISION

- Chosen architecture: **A. bundled client application + existing remote
  backend/API.** Rationale:
  - Auth depends on Supabase cookie sessions + OAuth/PKCE callbacks to
    `https://tooolvibes.eu`; static export would kill SSR, Server
    Components, cookies, API routes, middleware — explicitly forbidden.
  - The safe pattern is a Capacitor shell loading the canonical remote
    product URL (same ONE UI, ONE data/state/graph/motion system),
    with native plugins (Haptics, App/DeepLinks, StatusBar, Keyboard,
    Browser) bridged through the capability layer.
  - No remote-dev live-reload URL in production builds; the shell points
    at the pinned production origin configured per environment.
- Blocking limitation: NONE for the shell itself. Native builds additionally
  require Xcode (iOS) / Android SDK (Android) on the build machine —
  reported honestly in the final report; no fake native code is committed
  when the toolchain is absent.
- Native MUST NOT fork UI: all product rendering stays in this repo.

## 8. What this unlocks (Phases D–G)

1. `lib/platform/*` capability service (feature detection first).
2. `lib/feedback/*` ONE haptic API over native→vibrate→silent.
3. Manifest + icons + iOS/Android install experience.
4. Capacitor config + native projects only if toolchain present.
