import { cachedImageUrl } from "./img";

// On Cloudflare Pages the built-in /_next/image endpoint is a passthrough
// that strips caching (cf-cache-status: DYNAMIC, cache-control: no-cache),
// so every image loads from origin on every view. This loader skips it:
// Supabase storage images go through the cached /img/ proxy, local files in
// /public are served directly by the Pages CDN. Images are already uploaded
// pre-compressed, so no resizing is needed and quality is untouched.
export default function cloudflareLoader({ src }: { src: string; width: number; quality?: number }) {
  return cachedImageUrl(src);
}
