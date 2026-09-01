import { readdir } from "node:fs/promises";
import path from "node:path";

// Dev-only index of the facade screens. Remove alongside app/facades/[slug]/route.js.
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  let screens = [];
  try {
    const entries = await readdir(path.join(process.cwd(), "facades"), {
      withFileTypes: true,
    });
    screens = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    screens = [];
  }

  const items = screens.length
    ? screens.map((s) => `<li><a href="/facades/${s}">${s}</a></li>`).join("")
    : "<li>No screens in facades/ yet.</li>";

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Facades</title>
<style>
  body { font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
         margin: 48px; color: #16181d; }
  h1 { font-size: 16px; letter-spacing: .3px; text-transform: uppercase; color: #8f95a6; }
  ul { list-style: none; padding: 0; }
  li { padding: 6px 0; border-bottom: 1px solid #e3e6ef; }
  a { color: #4f46e5; text-decoration: none; font-family: ui-monospace, Menlo, monospace; }
  p { color: #8f95a6; font-size: 12.5px; margin-top: 28px; }
</style></head>
<body><h1>Facade screens</h1><ul>${items}</ul>
<p>Dev only. Screenshot at 1440&times;900 @2x.</p></body></html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
