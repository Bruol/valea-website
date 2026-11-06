// Serves the static site and proxies Plausible through first-party paths, so
// content blockers that match `plausible.*` URLs don't drop the analytics.
// Only `/a/*` reaches this code (see `run_worker_first` in wrangler.jsonc).

const PLAUSIBLE = "https://plausible.bruol.com";
const SCRIPT = "/js/pa-GQkuf2AkQV9F3O8Q2XFsQ.js";

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/a/s.js" && request.method === "GET") {
      const upstream = await fetch(PLAUSIBLE + SCRIPT, {
        cf: { cacheTtl: 3600, cacheEverything: true },
      });
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "content-type": "application/javascript",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    if (pathname === "/a/e" && request.method === "POST") {
      const upstream = await fetch(PLAUSIBLE + "/api/event", {
        method: "POST",
        headers: {
          "content-type": request.headers.get("content-type") ?? "text/plain",
          "user-agent": request.headers.get("user-agent") ?? "",
          "x-forwarded-for": request.headers.get("cf-connecting-ip") ?? "",
        },
        body: await request.text(),
      });
      return new Response(upstream.body, {
        status: upstream.status,
        headers: { "content-type": upstream.headers.get("content-type") ?? "text/plain" },
      });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
