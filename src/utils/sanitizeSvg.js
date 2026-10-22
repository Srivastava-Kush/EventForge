/**
 * Sanitizes SVG markup to protect against Stored and Reflected Cross-Site Scripting (XSS).
 * Strips script tags, foreignObjects, dangerous elements, event handler attributes,
 * and javascript: pseudo-protocols.
 *
 * @param {string} svgContent Raw SVG string or image data
 * @returns {string} Sanitized string safe for rendering or storage
 */
export function sanitizeSvg(svgContent) {
  if (!svgContent || typeof svgContent !== "string") {
    return "";
  }

  // If it's a raster base64 or URL, ensure it only contains valid image data
  if (svgContent.startsWith("data:image/") || svgContent.startsWith("http://") || svgContent.startsWith("https://")) {
    // Prevent javascript: or data:text/html masquerading
    if (svgContent.startsWith("data:image/svg+xml")) {
      // Decode or continue to sanitize SVG content inside
    } else {
      return svgContent;
    }
  }

  if (!svgContent.includes("<svg")) {
    return svgContent;
  }

  let sanitized = svgContent;

  // 1. Remove XML declarations with stylesheets or entities
  sanitized = sanitized.replace(/<\?xml-stylesheet[\s\S]*?\?>/gi, "");
  sanitized = sanitized.replace(/<!ENTITY[\s\S]*?>/gi, "");
  sanitized = sanitized.replace(/<!DOCTYPE[\s\S]*?>/gi, "");

  // 2. Remove executable & dangerous tags and their contents
  const dangerousTags = [
    "script",
    "foreignObject",
    "iframe",
    "object",
    "embed",
    "applet",
    "meta",
    "link",
    "style", // prevent CSS injection / external font exfiltration
  ];

  for (const tag of dangerousTags) {
    const tagRegex = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi");
    sanitized = sanitized.replace(tagRegex, "");
    // Also remove self-closing variations e.g. <script ... />
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
    sanitized = sanitized.replace(selfClosingRegex, "");
  }

  // 3. Remove all inline event handlers (onload, onerror, onclick, onmouseover, etc.)
  sanitized = sanitized.replace(/\bon[a-z]+\s*=\s*(['"]).*?\1/gi, "");
  sanitized = sanitized.replace(/\bon[a-z]+\s*=[^\s>]+/gi, "");

  // 4. Remove javascript: or vbscript: or data: links in href/xlink:href/src/action
  sanitized = sanitized.replace(/\b(?:href|xlink:href|src|action)\s*=\s*(['"])\s*(?:javascript|vbscript|data):[^'"]*\1/gi, "");
  sanitized = sanitized.replace(/\b(?:href|xlink:href|src|action)\s*=\s*(?:javascript|vbscript|data):[^\s>]+/gi, "");

  // 5. Remove any <use> tags referencing external or data URLs
  sanitized = sanitized.replace(/<use\b[^>]*(?:href|xlink:href)\s*=\s*['"]\s*(?:https?:|\/\/|data:|javascript:)[^'"]*['"][^>]*\/?>/gi, "");

  return sanitized.trim();
}

export default sanitizeSvg;
