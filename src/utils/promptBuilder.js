/**
 * Extracts user-facing prompt text from an LLM prompt context object.
 * Moved here from ai/ideas.js to keep prompt logic centralised and testable.
 */

/** Removes angle brackets so user text can never close or open a prompt fence. */
export const fenceSafe = (value) => value.replace(/[<>]/g, "");

/**
 * Builds a plain-text event summary for context injection into the chat system prompt.
 * Called by chat.service.js before every LLM chat call.
 * @param {any[]} events
 * @returns {string}
 */
export function buildEventsSummary(events) {
  if (!events || events.length === 0) return "(No saved events yet.)";
  return events
    .map((ev, i) => {
      const input = ev.input || {};
      const plan = ev.plan || {};
      const budget = plan.budget || {};
      const title = input.eventName || "(untitled)";
      const type = input.eventType || "unknown";
      const date = input.date || "TBD";
      const guests = input.guestCount || "?";
      const bAmount = input.budget || "?";
      const curr = input.currency || "";
      const tier = budget.tier || "?";

      return [
        `Event ${i + 1}: ${type} — "${title}"`,
        `  Date: ${date} | Guests: ${guests} | Budget: ${bAmount} ${curr}`,
        `  Budget tier: ${tier} | Status: saved`,
      ].join("\n");
    })
    .join("\n\n");
}

/**
 * Builds the system prompt for the chatbot, injecting all of the user's saved events.
 * @param {string} eventsSummary  Output of buildEventsSummary()
 * @returns {string}
 */
export function buildChatSystemPrompt(eventsSummary) {
  return `You are a friendly, practical event-planning assistant. You help users plan and refine their events.

The user's saved events are listed below. Use this context to give specific, relevant advice.
If the user asks about "my event" or "my wedding" etc., refer to these events.

--- USER'S SAVED EVENTS ---
${eventsSummary}
--- END OF EVENTS ---

Always be encouraging, realistic, and focused on helping the user stay on budget and on schedule.`;
}
