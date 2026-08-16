// Supabase storage responses are sent with cache-control: no-cache, so the
// browser revalidates them on every page view. Rewriting public storage URLs
// to the same-origin /img/ proxy lets Cloudflare edge-cache them and lets the
// browser keep them forever (filenames are unique per upload).
const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;

export function cachedImageUrl(src: string): string {
  if (src && src.startsWith(STORAGE_PREFIX)) {
    return `/img?p=${encodeURIComponent(src.slice(STORAGE_PREFIX.length))}`;
  }
  return src;
}
