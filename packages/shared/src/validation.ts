/** Shared form rules. Every frontend enforces these so the same input is
 *  accepted or rejected identically in the learner, instructor and admin apps,
 *  matching the checks in backend/core/validators.py.
 */

export const MIN_AGE = 5;
export const MAX_AGE = 120;

export const NAME_MSG =
  "Only letters, spaces, hyphens and apostrophes are allowed";

const NAME_RE = /^[A-Za-z]+(?:['-][A-Za-z]+)*$/;

export function isValidName(value: string): boolean {
  return NAME_RE.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidAge(value: string | number | null | undefined): boolean {
  if (value === "" || value === null || value === undefined) return true;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n >= MIN_AGE && n <= MAX_AGE;
}

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export const AVATAR_SIZE_MSG = "File size must not exceed 2 MB.";

/** True when the picked file is within the advertised 2 MB photo limit. */
export function isAvatarSizeAllowed(file: File | null | undefined): boolean {
  if (!file) return true;
  return file.size <= MAX_AVATAR_BYTES;
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i;

/** A cover image URL must point at an image file, not a PDF or other document. */
export function isImageUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return true;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const path = decodeURIComponent(parsed.pathname);
  return IMAGE_EXT_RE.test(path);
}

/** A course title needs at least one letter or digit, so "----" is rejected
 *  while legitimate titles like ".NET" or "C++" still pass.
 */
export function hasReadableTitle(title: string): boolean {
  return /[\p{L}\p{N}]/u.test(title);
}