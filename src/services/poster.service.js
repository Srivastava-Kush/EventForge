import { randomUUID } from "node:crypto";
import { generatePosterWithGemini } from "./llm.service.js";
import { sanitizeSvg } from "../utils/sanitizeSvg.js";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

/**
 * Returns suggested poster styles and prompts tailored to the specific event.
 * @param {object} event
 * @returns {Array<object>}
 */
export function buildPosterSuggestions(event) {
  const eventName = event.plan?.summary?.eventName || event.input?.eventName || `${event.type || "Event"} Celebration`;
  const vibe = event.input?.vibe || "celebratory";

  return [
    {
      id: "style-1",
      name: "Modern Minimalist",
      style: "modern",
      prompt: `Minimalist modern typography poster for ${eventName}. Clean geometric layout with soft warm pastel tones, subtle gold framing, and serene festive elegance.`,
      palette: ["#1e293b", "#f8fafc", "#e2e8f0", "#6366f1"],
    },
    {
      id: "style-2",
      name: "Luxury Gold & Midnight",
      style: "luxury",
      prompt: `Opulent luxury event poster for ${eventName}. Midnight velvet background with sparkling gold foil accents, art-deco flourishes, and grand celebratory ambiance.`,
      palette: ["#0f172a", "#fbbf24", "#d97706", "#ffffff"],
    },
    {
      id: "style-3",
      name: "Botanical Garden",
      style: "botanical",
      prompt: `Lush botanical illustration poster for ${eventName}. Delicate eucalyptus leaves, soft peach and ivory florals, natural organic textures, and hand-lettered styling.`,
      palette: ["#14532d", "#86efac", "#fef3c7", "#1c1917"],
    },
    {
      id: "style-4",
      name: "Neon Festival Vibe",
      style: "neon",
      prompt: `Electric vibrant neon celebration poster for ${eventName} (${vibe}). Radiant glowing cyan and magenta lights, dynamic party energy, and bold typography.`,
      palette: ["#09090b", "#06b6d4", "#ec4899", "#a855f7"],
    },
  ];
}

/**
 * Generates an SVG vector graphic poster rendered according to the chosen style and event facts.
 */
export function generateSvgPoster({ title, subtitle, date, location, style = "modern" }) {
  const cleanTitle = (title || "Grand Celebration").replace(/[<>&"]/g, "");
  const cleanSub = (subtitle || "Join us for an unforgettable event").replace(/[<>&"]/g, "");
  const cleanDate = (date || "").replace(/[<>&"]/g, "");
  const cleanLoc = (location || "").replace(/[<>&"]/g, "");

  let bgGradient = `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1e2f" />
        <stop offset="50%" stop-color="#13141f" />
        <stop offset="100%" stop-color="#0a0a10" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ec4899" />
        <stop offset="50%" stop-color="#8b5cf6" />
        <stop offset="100%" stop-color="#3b82f6" />
      </linearGradient>
    </defs>
  `;
  let frameColor = "#4f46e5";
  let textColor = "#ffffff";
  let accentColor = "#a78bfa";

  if (style === "luxury") {
    bgGradient = `
      <defs>
        <radialGradient id="bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#1c1917" />
          <stop offset="100%" stop-color="#09090b" />
        </radialGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde047" />
          <stop offset="50%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
      </defs>
    `;
    frameColor = "#f59e0b";
    textColor = "#fef08a";
    accentColor = "#fbbf24";
  } else if (style === "botanical") {
    bgGradient = `
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#064e3b" />
          <stop offset="100%" stop-color="#022c22" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#a7f3d0" />
          <stop offset="100%" stop-color="#fef3c7" />
        </linearGradient>
      </defs>
    `;
    frameColor = "#34d399";
    textColor = "#ecfdf5";
    accentColor = "#6ee7b7";
  } else if (style === "neon") {
    bgGradient = `
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#09090b" />
          <stop offset="100%" stop-color="#180e29" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00f5ff" />
          <stop offset="50%" stop-color="#ff007f" />
          <stop offset="100%" stop-color="#ffe600" />
        </linearGradient>
      </defs>
    `;
    frameColor = "#00f5ff";
    textColor = "#ffffff";
    accentColor = "#ff007f";
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1120" width="100%" height="100%">
  ${bgGradient}
  <rect width="800" height="1120" fill="url(#bg)" />

  <!-- Outer Decorative Border -->
  <rect x="40" y="40" width="720" height="1040" rx="16" fill="none" stroke="${frameColor}" stroke-width="2" stroke-opacity="0.4" />
  <rect x="52" y="52" width="696" height="1016" rx="12" fill="none" stroke="${frameColor}" stroke-width="1" stroke-opacity="0.2" />

  <!-- Corner Flourishes -->
  <circle cx="52" cy="52" r="6" fill="${frameColor}" />
  <circle cx="748" cy="52" r="6" fill="${frameColor}" />
  <circle cx="52" cy="1068" r="6" fill="${frameColor}" />
  <circle cx="748" cy="1068" r="6" fill="${frameColor}" />

  <!-- Header Badge -->
  <g transform="translate(400, 160)">
    <rect x="-140" y="-22" width="280" height="44" rx="22" fill="${frameColor}" fill-opacity="0.15" stroke="${frameColor}" stroke-width="1.5" />
    <text text-anchor="middle" y="6" fill="${accentColor}" font-family="'Outfit', sans-serif" font-size="14" font-weight="700" letter-spacing="4">YOU ARE CORDIALLY INVITED</text>
  </g>

  <!-- Title -->
  <text text-anchor="middle" x="400" y="320" fill="${textColor}" font-family="'Outfit', sans-serif" font-size="44" font-weight="800" letter-spacing="1">
    ${cleanTitle.slice(0, 30)}
  </text>
  ${cleanTitle.length > 30 ? `<text text-anchor="middle" x="400" y="375" fill="${textColor}" font-family="'Outfit', sans-serif" font-size="36" font-weight="800">${cleanTitle.slice(30, 60)}</text>` : ""}

  <!-- Divider Line -->
  <line x1="260" y1="440" x2="540" y2="440" stroke="url(#accent)" stroke-width="3" stroke-linecap="round" />

  <!-- Subtitle / Vibe -->
  <text text-anchor="middle" x="400" y="510" fill="#cbd5e1" font-family="'Inter', sans-serif" font-size="20" font-weight="400" letter-spacing="0.5">
    ${cleanSub.slice(0, 48)}
  </text>
  ${cleanSub.length > 48 ? `<text text-anchor="middle" x="400" y="545" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="18">${cleanSub.slice(48, 96)}</text>` : ""}

  <!-- Central Graphic Element -->
  <g transform="translate(400, 680)">
    <circle cx="0" cy="0" r="110" fill="none" stroke="url(#accent)" stroke-width="2" stroke-dasharray="6 6" />
    <circle cx="0" cy="0" r="85" fill="${frameColor}" fill-opacity="0.1" />
    <polygon points="0,-60 18,-18 60,-18 26,10 40,52 0,26 -40,52 -26,10 -60,-18 -18,-18" fill="url(#accent)" opacity="0.9" />
  </g>

  <!-- Event Details Box -->
  <g transform="translate(400, 880)">
    <rect x="-240" y="-45" width="480" height="90" rx="16" fill="#000000" fill-opacity="0.35" stroke="${frameColor}" stroke-width="1" />
    ${cleanDate ? `<text text-anchor="middle" y="-10" fill="${textColor}" font-family="'Outfit', sans-serif" font-size="22" font-weight="700">DATE: ${cleanDate}</text>` : ""}
    ${cleanLoc ? `<text text-anchor="middle" y="24" fill="${accentColor}" font-family="'Inter', sans-serif" font-size="16" font-weight="500">${cleanLoc}</text>` : `<text text-anchor="middle" y="24" fill="${accentColor}" font-family="'Inter', sans-serif" font-size="16" font-weight="500">HONORING OUR SPECIAL GUESTS</text>`}
  </g>

  <!-- Footer Tagline -->
  <text text-anchor="middle" x="400" y="1030" fill="#64748b" font-family="'Inter', sans-serif" font-size="13" letter-spacing="2">PLEASE RSVP AT YOUR EARLIEST CONVENIENCE</text>
</svg>
  `.trim();
}

/**
 * Generates an event poster using Google Gemini AI with customized prompt,
 * falling back to custom AI vector SVG and deterministic generator if needed.
 */
export async function generatePosterWithAi({ title, subtitle, date, location, style = "modern", prompt = "", eventType = "event", engine = "auto" }) {
  const result = await generatePosterWithGemini({ title, subtitle, date, location, style, prompt, eventType, engine });
  if (result?.data) {
    if (result.type === "svg" || typeof result.data === "string" && result.data.includes("<svg")) {
      result.data = sanitizeSvg(result.data);
      if (result.svg) result.svg = sanitizeSvg(result.svg);
    }
    return result;
  }
  const fallbackSvg = sanitizeSvg(generateSvgPoster({ title, subtitle, date, location, style }));
  return {
    type: "svg",
    data: fallbackSvg,
    svg: fallbackSvg,
  };
}

/**
 * Appends a saved poster design to the event document.
 * @param {object} event
 * @param {object} posterData
 * @returns {Promise<object>}
 */
export async function savePosterToEvent(event, posterData) {
  if (!posterData.imageData) {
    throw new AppError("Poster image data is required.", HTTP_STATUS.BAD_REQUEST);
  }

  const cleanImageData = sanitizeSvg(posterData.imageData);
  if (!cleanImageData) {
    throw new AppError("Invalid or disallowed poster image data.", HTTP_STATUS.BAD_REQUEST);
  }

  const newPoster = {
    id: `poster-${randomUUID().slice(0, 8)}`,
    title: posterData.title?.trim() || "Event Poster",
    prompt: posterData.prompt?.trim() || "Custom Design",
    style: posterData.style || "modern",
    imageData: cleanImageData,
    createdAt: new Date(),
  };

  event.posters.push(newPoster);
  await event.save();
  return { poster: newPoster, posters: event.posters };
}

/**
 * Deletes a saved poster design from the event document.
 * @param {object} event
 * @param {string} posterId
 * @returns {Promise<object>}
 */
export async function deletePosterFromEvent(event, posterId) {
  event.posters = event.posters.filter((p) => p.id !== posterId);
  await event.save();
  return { posters: event.posters };
}
