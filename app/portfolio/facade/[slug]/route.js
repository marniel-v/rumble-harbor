import { readFile } from "node:fs/promises";
import path from "node:path";
import { works } from "@/components/capabilities/works";

export const dynamic = "force-dynamic";

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
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return new Response(`No facade at facades/${slug}/index.html`, {
      status: 404,
    });
  }
}
