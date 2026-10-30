import { fenceSafe, screenPromptInjection } from "../security/promptGuard.js";

/**
 * Extracts user-facing prompt text from an LLM prompt context object.
 * Moved here from ai/ideas.js to keep prompt logic centralised and testable.
 */

export { fenceSafe, screenPromptInjection };

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
 * Builds real-time context for the active event currently in focus.
 * Injects current expenses spent, overdue tasks, booked vendors, and RSVP headcount.
 * @param {any} event
 * @param {any} [metrics]
 * @returns {string}
 */
export function buildActiveEventContext(event, metrics) {
  if (!event) return "";
  const input = event.input || {};
  const plan = event.plan || {};
  const title = input.eventName || `${input.eventType} Plan`;
  const date = input.date || "TBD";
  const daysToGo = plan.summary?.daysToGo ?? "N/A";

  const totalBudget = metrics?.budget?.totalBudget || input.budget || 0;
  const spent = metrics?.budget?.totalActualCost || 0;
  const remaining = metrics?.budget?.remainingBudget || 0;
  const currency = metrics?.budget?.currency || input.currency || "USD";

  const totalTasks = metrics?.tasks?.total || 0;
  const pendingTasks = metrics?.tasks?.pending || 0;
  const overdueTasks = metrics?.tasks?.overdue || 0;

  const totalVendors = metrics?.vendors?.total || 0;
  const bookedVendors = metrics?.vendors?.booked || 0;
  const pendingVendors = metrics?.vendors?.pending || 0;

  const attendingGuests = metrics?.guests?.attending || 0;
  const totalInvited = metrics?.guests?.totalInvited || 0;

  return [
    `--- ACTIVE EVENT IN FOCUS (Real-Time State) ---`,
    `Event: "${title}" (${input.eventType}) | Date: ${date} (${daysToGo} days to go)`,
    `Financials: Budget ${totalBudget} ${currency} | Actual Spent: ${spent} ${currency} | Remaining: ${remaining} ${currency}`,
    `Checklist: ${pendingTasks} pending tasks (${overdueTasks} OVERDUE) out of ${totalTasks} total`,
    `Vendors: ${bookedVendors} booked / ${pendingVendors} pending (Total: ${totalVendors})`,
    `Guest Attendance: ${attendingGuests} confirmed attending out of ${totalInvited} invited`,
    `---`,
    `ACTIONABLE RECOMMENDATIONS FORMAT:`,
    `If you recommend a concrete task or vendor, include an action block so the user can 1-click apply it:`,
    `[ACTION:ADD_TASK] {"title": "Task title", "phase": "Plan & book"}`,
    `[ACTION:ADD_VENDOR] {"name": "Vendor name", "priority": "recommended"}`,
  ].join("\n");
}

/**
 * Builds the system prompt for the chatbot, injecting all of the user's saved events.
 * @param {string} eventsSummary  Output of buildEventsSummary()
 * @param {string} [activeEventContext=""] Real-time active event context
 * @returns {string}
 */
export function buildChatSystemPrompt(eventsSummary, activeEventContext = "") {
  return `You are a friendly, practical event-planning assistant. You help users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas.

${activeEventContext ? activeEventContext + "\n\n" : ""}The user's saved events are listed below. Use this context to give specific, relevant advice:
--- USER'S SAVED EVENTS ---
${eventsSummary}
--- END OF EVENTS ---

Always be encouraging, realistic, and focused on helping the user stay on budget and on schedule.`;
}

