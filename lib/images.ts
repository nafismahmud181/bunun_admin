// Uploaded images are stored at these widths, named …-<width>.webp (see the backend's services/images.ts).
const WIDTHS = [400, 800, 1200];

/**
 * An image URL at (at least) the given width: the smallest stored size of an uploaded image, or
 * the Pexels `w` parameter for the original catalogue photos. Other URLs are returned as-is.
 */
export function imgSrc(url: string, w = 400) {
  const m = /-(\d+)\.webp$/.exec(url);
  if (m && WIDTHS.includes(Number(m[1]))) {
    const size = WIDTHS.find((s) => s >= w) ?? WIDTHS[WIDTHS.length - 1];
    return url.replace(/-\d+\.webp$/, `-${size}.webp`);
  }
  try {
    const u = new URL(url);
    if (u.hostname !== 'images.pexels.com') return url;
    u.searchParams.set('w', String(w));
    return u.toString();
  } catch {
    return url;
  }
}
