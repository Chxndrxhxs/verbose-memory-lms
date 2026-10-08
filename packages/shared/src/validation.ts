import { z } from "zod";

/** Shared form rules. Every frontend enforces these so the same input is
 *  accepted or rejected identically in the learner, instructor and admin apps,
 *  matching the checks in backend/core/validators.py.
 */

export const MIN_AGE = 1;
export const MAX_AGE = 100;

export const NAME_MSG =
  "Only letters, spaces, hyphens and apostrophes are allowed";

// Mirrors NAME_RE in backend/core/validators.py. Spaces are part of the rule
// there (a profile name arrives as "Maya Chen" and is split on the first
// space), so rejecting them here would make those names unsaveable.
const NAME_RE = /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/;

export function isValidName(value: string): boolean {
  return NAME_RE.test(value.trim());
}

export const MAX_NAME_LENGTH = 60;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const EMAIL_MSG = "Enter a valid email address";

export const AGE_MSG = `Please enter a valid age between ${MIN_AGE} and ${MAX_AGE}`;

/** Age is a plain number input, so the value can arrive as a string. A blank
 *  value is rejected: clearing age used to slip through both the client check
 *  and the API, which is RAM-8.
 */
export function isValidAge(value: string | number | null | undefined): boolean {
  if (value === "" || value === null || value === undefined) return false;
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

/** A course or assignment title is a short human phrase: at least one
 *  letter or digit and no run of 3+ symbols — so "----" and
 *  "qwertyuiop !@#$%12345" are rejected while ".NET", "C++",
 *  "A/B Testing" and "日本語 Test" still pass.
 *  Mirrors validate_title() in backend/core/validators.py.
 */
export function isValidTitle(title: string): boolean {
  const text = title.trim();
  if (!/[\p{L}\p{N}]/u.test(text)) return false;
  return !/[^\p{L}\p{N}\p{M}\s_]{3,}/u.test(text);
}

export const TITLE_MSG =
  "Title must be a real phrase — no long symbol runs or random characters";

/** zod field builders so every profile form validates the same way instead of
 *  each app keeping its own copy of these rules. Each wraps the predicate above,
 *  so the TS and Python sides stay one rule expressed twice.
 */
export function nameField(label = "Name", opts?: { min?: number; max?: number }) {
  const min = opts?.min ?? 1;
  const max = opts?.max ?? MAX_NAME_LENGTH;
  return z
    .string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`)
    .refine(isValidName, NAME_MSG);
}

export function emailField(label = "Email") {
  return z.string().trim().min(1, `${label} is required`).refine(isValidEmail, EMAIL_MSG);
}

export function ageField() {
  // Kept as a string so every form can validate the raw input before coercing;
  // a number input still delivers "" for a cleared field, which is rejected.
  return z
    .string()
    .trim()
    .min(1, "Age is required")
    .refine(isValidAge, AGE_MSG);
}

export function cityField(label = "City") {
  return nameField(label);
}

/** An exam paper's total is a few hundred marks at most; anything wildly
 *  beyond that is a typo (RAM-44).
 */
export const MIN_TOTAL_MARKS = 1;
export const MAX_TOTAL_MARKS = 1000;

export function isValidTotalMarks(value: number | string | null | undefined): boolean {
  if (value === "" || value === null || value === undefined) return true;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= MIN_TOTAL_MARKS && n <= MAX_TOTAL_MARKS;
}

export const TOTAL_MARKS_MSG = `Total marks must be between ${MIN_TOTAL_MARKS} and ${MAX_TOTAL_MARKS}`;