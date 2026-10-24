import { randomUUID } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { DEFAULT_MODEL, FALLBACK_MODEL } from "./llm.service.js";
import { sanitizeSvg } from "../utils/sanitizeSvg.js";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { getOwnedEvent } from "./event.service.js";

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
 * Generates photorealistic/artistic raster images (PNG/JPEG) using FLUX & open diffusion pipelines.
 */
export async function generateRasterImageWithFlux({
  title,
  subtitle,
  date,
  location,
  style = "modern",
  prompt = "",
  eventType = "event",
}) {
  const effectivePrompt = (prompt && prompt.trim()) ||
    `High-end promotional invitation poster for a ${eventType} titled "${title}". ${subtitle ? `Vibe: ${subtitle}. ` : ""}${date ? `Date: ${date}. ` : ""}${location ? `Venue: ${location}. ` : ""}Aesthetic: ${style} with rich decorative styling, perfect typography, and balanced layout.`;

  // 1. First, check if native Gemini image generation works on this key
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const candidateImageModels = ["gemini-3.1-flash-image", "gemini-3-pro-image", "gemini-2.5-flash-image"];
      for (const imgModel of candidateImageModels) {
        try {
          const imgResponse = await ai.models.generateContent({
            model: imgModel,
            contents: effectivePrompt,
          });
          const parts = imgResponse.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.inlineData && p.inlineData.data) {
              return {
                type: "image",
                mimeType: p.inlineData.mimeType || "image/png",
                data: `data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}`,
              };
            }
          }
        } catch {
          // Continue to next model or FLUX
        }
      }
    } catch {
      // Continue to FLUX
    }
  }

  // 2. Open Diffusion / FLUX Generator
  const cleanPrompt = (prompt && prompt.trim()) || `${title}, ${subtitle || ''}, ${location ? `${location}, ` : ''}${style} style event poster, cinematic lighting, 8k, detailed artwork`;
  const seed = Math.floor(Math.random() * 1000000);
  const fluxUrl = `https://pollinations.ai/p/${encodeURIComponent(cleanPrompt.slice(0, 300))}?width=768&height=1024&seed=${seed}`;

  try {
    const res = await fetch(fluxUrl, {
      signal: AbortSignal.timeout(3000),
      headers: {
        Accept: "image/jpeg,image/png,image/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) EventForge/1.0",
      },
    });

    if (res.ok) {
      const mime = res.headers.get("content-type") || "image/jpeg";
      if (mime.startsWith("image/")) {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return {
          type: "image",
          mimeType: mime,
          data: `data:${mime};base64,${base64}`,
          imageUrl: fluxUrl,
        };
      }
    }
  } catch (err) {
    console.warn("[poster-gen] FLUX server-side fetch:", err.message);
  }

  // Return direct image URL so client browser can render it directly
  return {
    type: "image",
    mimeType: "image/jpeg",
    data: fluxUrl,
    imageUrl: fluxUrl,
  };
}

/**
 * Generates an SVG vector graphic or raster image poster via Gemini AI models.
 */
export async function generatePosterWithGemini({
  title,
  subtitle,
  date,
  location,
  style = "modern",
  prompt = "",
  eventType = "event",
  engine = "auto",
  aiClient = null,
}) {
  if (engine === "flux" || engine === "image") {
    return generateRasterImageWithFlux({ title, subtitle, date, location, style, prompt, eventType });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !aiClient) {
    return { type: "svg", data: null, error: "GEMINI_API_KEY is not configured." };
  }
  const ai = aiClient || new GoogleGenAI({ apiKey });

  const effectivePrompt = (prompt && prompt.trim()) ||
    `High-end promotional invitation poster for a ${eventType} titled "${title}". ${subtitle ? `Vibe: ${subtitle}.` : ""} Date: ${date}. Venue: ${location}. Aesthetic: ${style} with rich decorative styling, perfect typography, and balanced layout.`;

  // If engine is auto, check if native raster image generation is available
  if (engine === "auto") {
    const candidateImageModels = ["gemini-3.1-flash-image", "gemini-3-pro-image", "gemini-2.5-flash-image"];
    for (const imgModel of candidateImageModels) {
      try {
        const imgResponse = await ai.models.generateContent({
          model: imgModel,
          contents: effectivePrompt,
        });
        const parts = imgResponse.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          if (p.inlineData && p.inlineData.data) {
            return {
              type: "image",
              mimeType: p.inlineData.mimeType || "image/png",
              data: `data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}`,
            };
          }
        }
      } catch {
        // Fallback to Gemini vector generation
      }
    }
  }

  // 2. Fallback: prompt Gemini to generate a custom SVG vector poster
  try {
    const svgPrompt = `You are an elite vector graphic designer and typography expert.
Create a complete, stunning, high-resolution SVG poster (viewBox="0 0 800 1120") for the following event and specifications:
- Event Title: "${title}"
- Subtitle / Tagline: "${subtitle}"
- Date: "${date}"
- Location / Venue: "${location}"
- Design Theme: "${style}"
- User's Custom Design Prompt: "${effectivePrompt}"

Requirements:
1. Output ONLY valid, self-contained SVG code starting with <svg and ending with </svg>.
2. The root element must have: viewBox="0 0 800 1120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"
3. Do not enclose the output in markdown code blocks (\`\`\`xml or \`\`\`svg). Output raw SVG text directly.
4. CRITICAL TYPOGRAPHY & BOUNDARIES:
   - ALL text elements (<text>) MUST have text-anchor="middle" and x="400" so they are centered horizontally and never overflow past the 800px width.
   - If a subtitle or title is long, use an appropriately sized font (e.g. 20-36px) or split across <tspan x="400" dy="..."> lines so the text stays strictly within the inner margins (between x=80 and x=720).
   - All borders, frames, illustrations, and motifs must be completely contained within the 800x1120 canvas area.
5. Use modern, beautiful gradients (<linearGradient>, <radialGradient>), layered drop shadows, decorative ornamental borders, flourishes or geometric motifs appropriate for the theme.
6. Ensure all typography (<text>) is clearly legible and uses appropriate font-family (serif, sans-serif, 'Cinzel', 'Playfair Display', 'Inter', or 'Montserrat').`;

    let svgRes;
    try {
      svgRes = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: svgPrompt,
      });
    } catch {
      svgRes = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents: svgPrompt,
      });
    }

    let raw = svgRes.text?.trim() || "";
    // Clean any markdown fences if present
    raw = raw.replace(/^```(?:svg|xml)?\s*/i, "").replace(/\s*```$/, "").trim();
    if (raw.includes("<svg") && raw.includes("</svg>")) {
      const startIdx = raw.indexOf("<svg");
      const endIdx = raw.lastIndexOf("</svg>") + 6;
      let cleanSvg = raw.slice(startIdx, endIdx);

      // Normalize root <svg> tag attributes for perfect scaling
      cleanSvg = cleanSvg.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
        let cleanAttrs = attrs
          .replace(/\bwidth="[^"]*"/gi, '')
          .replace(/\bheight="[^"]*"/gi, '')
          .replace(/\bpreserveAspectRatio="[^"]*"/gi, '');
        if (!/viewBox=/i.test(cleanAttrs)) {
          cleanAttrs += ' viewBox="0 0 800 1120"';
        }
        return `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"${cleanAttrs}>`;
      });

      return {
        type: "svg",
        data: cleanSvg,
        svg: cleanSvg,
      };
    }
  } catch (svgErr) {
    console.warn(`[poster-gen] Gemini SVG generation error: ${svgErr.message}`);
  }

  return {
    type: "svg",
    data: null,
  };
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

/**
 * Returns suggested poster styles and prompts tailored to the specific event.
 * @param {string} eventId
 * @param {string} userId
 */
export async function getPosterSuggestions(eventId, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return buildPosterSuggestions(event);
}

/**
 * Persists a generated poster design to the specified event.
 * @param {string} eventId
 * @param {object} posterData
 * @param {string} userId
 */
export async function savePoster(eventId, posterData, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return savePosterToEvent(event, posterData);
}

/**
 * Deletes a saved poster design from the event.
 * @param {string} eventId
 * @param {string} posterId
 * @param {string} userId
 */
export async function deletePoster(eventId, posterId, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return deletePosterFromEvent(event, posterId);
}

