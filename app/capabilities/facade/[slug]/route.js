import { readFile } from "node:fs/promises";
import path from "node:path";
import { works } from "@/components/capabilities/works";

/**
 * Serves a facade as the document it is, for the overlay iframe.
 *
 * These are complete <html> pages with everything inlined and no external
 * requests, so they must bypass the app layout — a page component would nest
 * one inside the site shell and break it. That is why this is a Route Handler.
 *
 * Distinct from app/facades/, which is the dev-only capture viewer and 404s in
 * production. This one has to work in production, because the overlay depends
 * on it.
 *
 * facades/ is tracked, so the documents ship with the repo and there is one
 * copy of each rather than two that drift. Because they are read off disk at
 * request time rather than imported, next.config.mjs has to name them under
 * outputFileTracingIncludes or they are dropped from the serverless bundle —
 * which fails only in production, and silently.
 *
 * The disclosure deliberately is not injected here. It belongs on the overlay
 * chrome around the frame; the facades carry no disclaimer text so that they
 * photograph as product screens. The headers below are what covers the bare
 * URL: not indexed, and not embeddable anywhere but this origin.
 */
export const dynamic = "force-dynamic";

// Allowlist rather than a path regex. It closes traversal by construction, and
// it also means an unreferenced directory in facades/ is not quietly public.
const SERVABLE = new Set(works.flatMap((w) => w.views.map((v) => v.id)));

export async function GET(_request, { params }) {
  const { slug } = await params;
  if (!SERVABLE.has(slug)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const html = await readFile(
      path.join(process.cwd(), "facades", slug, "index.html"),
      "utf8",
    );
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex, nofollow",
        "content-security-policy": "frame-ancestors 'self'",
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new Response(`No facade at facades/${slug}/index.html`, {
      status: 404,
    });
  }
}
