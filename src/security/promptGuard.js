import { normalizeUnicode } from "./unicodeNormalizer.js";

/**
 * Adversarial prompt injection signatures commonly used in LLM jailbreaks and role confusion.
 */
const INJECTION_PATTERNS = [
  { name: "instruction_override", regex: /(?:ignore|disregard|forget|bypass)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|prompts|rules|commands)/i },
  { name: "system_override", regex: /(?:system\s+override|mode\s+switch|terminal\s+mode|administrative\s+override)/i },
  { name: "jailbreak_persona", regex: /(?:you\s+are\s+now|act\s+as)\s+(?:dan|developer\s+mode|unrestricted|an\s+evil|jailbreak)/i },
  { name: "prompt_extraction", regex: /(?:reveal|output|display|print|show)\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions|developer\s+message)/i },
  { name: "delimiter_injection", regex: /(?:<\/?(?:system|instruction|user_data|context|prompt|rules)>)/i },
];

/**
 * Screens user input for adversarial prompt injection patterns.
 * Disarms angle brackets to prevent delimiter breakout and tags suspicious phrases.
 *
 * @param {string} input - User-supplied free text
 * @returns {{ isSuspicious: boolean, sanitized: string, flags: string[] }}
 */
export function screenPromptInjection(input) {
  if (typeof input !== "string") {
    return { isSuspicious: false, sanitized: "", flags: [] };
  }

  const normalized = normalizeUnicode(input);
  const flags = [];

  for (const { name, regex } of INJECTION_PATTERNS) {
    if (regex.test(normalized)) {
      flags.push(name);
    }
  }

  // Disarm all angle brackets to prevent closing prompt fences
  const sanitized = normalized.replace(/[<>]/g, "");

  return {
    isSuspicious: flags.length > 0,
    sanitized,
    flags,
  };
}

/**
 * Disarms free-text user input so it can be safely injected inside an XML or markdown fence.
 *
 * @param {string} value - Raw user string
 * @returns {string} Disarmed, unicode-normalized string
 */
export function fenceSafe(value) {
  if (typeof value !== "string") return "";
  const { sanitized } = screenPromptInjection(value);
  return sanitized;
}
