export interface ProjectsEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  CONTACT_RATE_LIMITER: { limit(input: { key: string }): Promise<{ success: boolean }> };
  THANK_YOU_RATE_LIMITER: { limit(input: { key: string }): Promise<{ success: boolean }> };
  SITE_URL: string;
  SITE_HOST: string;
  PROJECTS_EMAIL_FROM: string;
  PROJECTS_TURNSTILE_SITE_KEY: string;
  RESEND_API_KEY: string;
  PROJECTS_NOTIFY_EMAIL: string;
  PROJECTS_TURNSTILE_SECRET_KEY: string;
}

export interface ProjectsContext {
  waitUntil(promise: Promise<unknown>): void;
}

export interface ProjectsHandler {
  fetch(request: Request, env: ProjectsEnv, ctx: ProjectsContext): Promise<Response>;
}
