import { siteConfig } from "@/lib/config/site";

export function GET() {
  const body = ["User-agent: *", "Allow: /", `Sitemap: ${siteConfig.url}/sitemap.xml`, ""].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
