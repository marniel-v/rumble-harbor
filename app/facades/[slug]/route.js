import { readFile } from "node:fs/promises";
import path from "node:path";

// Dev-only viewer for the facade screens in /facades (gitignored, not part of the site).
// Serves each screen's raw HTML document — these are full <html> pages, so they must
// bypass the app layout rather than render as a page component.
// Remove this route before production; until then it 404s outside development.
export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const { slug } = await params;
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const html = await readFile(
      path.join(process.cwd(), "facades", slug, "index.html"),
      "utf8"
    );
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return new Response(`No facade at facades/${slug}/index.html`, {
      status: 404,
    });
  }
}
