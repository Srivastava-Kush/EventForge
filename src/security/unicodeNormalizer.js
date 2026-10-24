/* eslint-disable no-control-regex */
/**
 * Unicode normalization and invisible character sanitation.
 * Neutralizes homoglyph bypasses and hidden zero-width injection attacks.
 */

// Zero-width spaces, joiners, directional overrides, and non-printable control characters
const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\u200E\u200F\uFEFF\u202A-\u202E\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

/**
 * Normalizes a text string to Unicode NFKC (Compatibility Decomposition followed by Canonical Composition)
 * and strips invisible/zero-width characters that attackers use to bypass string filters.
 *
 * @param {string} text - Raw input string
 * @returns {string} Clean, normalized string
 */
export function normalizeUnicode(text) {
  if (typeof text !== "string") return "";
  return text
    .normalize("NFKC")
    .replace(INVISIBLE_CHARS_REGEX, "")
    .trim();
}
