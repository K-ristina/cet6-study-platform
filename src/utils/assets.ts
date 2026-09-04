/**
 * Utility to resolve asset URLs (PDFs, Audio, Answers).
 * If VITE_ASSET_BASE_URL is configured (e.g., https://pub-xxx.r2.dev or https://cdn.example.com),
 * prepend it. Otherwise, return relative local paths.
 */
export function getAssetUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_ASSET_BASE_URL;
  if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    return path;
  }
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
