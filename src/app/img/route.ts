export const runtime = "edge";

// Same-origin proxy for Supabase storage images. Supabase serves them with
// cache-control: no-cache, so browsers revalidate on every view and nothing
// sticks in the Cloudflare edge cache. This route fetches the original bytes
// (no recompression) and serves them cacheable: a year in the browser
// (filenames are unique per upload, so immutable is safe) and edge-cached at
// Cloudflare via the cf fetch options.
// The path travels as a query param because some stored object keys contain
// double slashes that path segments would swallow.
const ALLOWED_BUCKETS = ["products", "categories", "gallery", "team"];

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams.get("p");
  if (!p || !ALLOWED_BUCKETS.some((b) => p.startsWith(`${b}/`))) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${p}`,
    { cf: { cacheEverything: true, cacheTtl: 31536000 } } as RequestInit
  );

  if (!upstream.ok || !upstream.body) {
    return new Response("Not found", { status: upstream.status || 404 });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
