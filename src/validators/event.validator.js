import { z } from "zod";
import { CONSIDERATIONS, CURRENCIES, EVENT_TYPES, PRIORITIES, SETTINGS } from "../planner/catalog.js";
import { addDays, parseIsoDate, startOfUtcDay } from "../planner/dates.js";

const MAX_YEARS_AHEAD = 5;
const TIME_ZONE_GRACE_DAYS = 1;

// Free text: strip control characters (keeping newlines) and trim
/** @param {number} max */
const freeText = (max) =>
  z
    .string()
    .max(max * 2)
    // eslint-disable-next-line no-control-regex
    .transform((value) => value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim())
    .pipe(z.string().max(max))
    .default("");

/**
 * @param {any} values
 * @param {number} max
 */
const uniqueList = (values, max) =>
  z
    .array(z.enum(values))
    .max(max)
    .default([])
    .transform((list) => [...new Set(list)]);

/** Request schema: strict (unknown keys rejected), typed, bounded. */
export const planRequestSchema = z.strictObject({
  eventType: z.enum(EVENT_TYPES, "Choose wedding, birthday or community event."),
  eventName: freeText(80),
  date: z.string("Choose the event date."),
  guestCount: z
    .number("Enter the number of guests.")
    .int("Use a whole number of guests.")
    .min(1, "Plan for at least 1 guest.")
    .max(5000, "Plans support up to 5000 guests."),
  budget: z
    .number("Enter your total budget.")
    .min(50, "Enter a budget of at least 50.")
    .max(100_000_000, "Enter a budget of at most 100,000,000."),
  currency: z.enum(CURRENCIES, `Choose one of: ${CURRENCIES.join(", ")}.`).default("USD"),
  setting: z.enum(SETTINGS, "Choose indoor, outdoor or hybrid.").default("indoor"),
  vibe: freeText(200),
  honoreeAge: z
    .number("Enter the age as a number.")
    .int("Use a whole number.")
    .min(0, "Age can't be negative.")
    .max(120, "Enter an age up to 120.")
    .optional(),
  priorities: uniqueList(PRIORITIES, PRIORITIES.length),
  considerations: uniqueList(CONSIDERATIONS, CONSIDERATIONS.length),
  notes: freeText(500),
  useAI: z.boolean().default(true),
});

/**
 * Validates and normalizes a plan request.
 * @param {unknown} body
 * @param {{ now?: Date }} [options]
 * @returns {{ success: true, data: object } | { success: false, errors: { field: string, message: string }[] }}
 */
export function validatePlanRequest(body, { now = new Date() } = {}) {
  const result = planRequestSchema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? "body"),
        message: issue.message,
      })),
    };
  }

  const data = result.data;
  const eventDate = parseIsoDate(data.date);
  const today = startOfUtcDay(now);
  if (!eventDate) {
    return { success: false, errors: [{ field: "date", message: "Use a valid date in YYYY-MM-DD format." }] };
  }
  if (eventDate < addDays(today, -TIME_ZONE_GRACE_DAYS)) {
    return { success: false, errors: [{ field: "date", message: "The event date cannot be in the past." }] };
  }
  const latest = new Date(Date.UTC(today.getUTCFullYear() + MAX_YEARS_AHEAD, today.getUTCMonth(), today.getUTCDate()));
  if (eventDate > latest) {
    return { success: false, errors: [{ field: "date", message: "Plans are supported up to 5 years ahead." }] };
  }
  if (data.eventType !== "birthday") delete data.honoreeAge;

  return { success: true, data };
}
