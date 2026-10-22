import { chatWithAssistant } from "./llm.service.js";
import { buildEventsSummary } from "../utils/promptBuilder.js";
import Event from "../models/Event.model.js";
import ChatHistory from "../models/ChatHistory.model.js";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const MAX_HISTORY_CONTEXT = 10; // messages sent to LLM as context
const MAX_STORED_MESSAGES = 200; // cap per user to prevent unbounded growth

/**
 * Sends a user message to the assistant and saves both the message and reply
 * to ChatHistory. Injects all of the user's saved events as system context.
 *
 * @param {string} userId
 * @param {string} message  User's raw message text (already sanitised by express-validator)
 * @returns {Promise<{ reply: string }>}
 */
export async function sendMessage(userId, message) {
  if (!message?.trim()) throw new AppError("Message cannot be empty.", HTTP_STATUS.BAD_REQUEST);


  // 1. Build event context from DB (lean projection of only required fields)
  const events = await Event.find({ user: userId }).select("input plan.budget.tier").lean();
  const eventsSummary = buildEventsSummary(events);

  // 2. Load chat history (or create new)
  let history = await ChatHistory.findOne({ user: userId });
  if (!history) {
    history = new ChatHistory({ user: userId, messages: [] });
  }

  // 3. Build recent context window for LLM
  const contextMessages = history.messages.slice(-MAX_HISTORY_CONTEXT);

  // 4. Call LLM (all LLM calls go through llm.service.js)
  const reply = await chatWithAssistant(message, contextMessages, eventsSummary);

  // 5. Append both messages and save
  const now = new Date();
  history.messages.push({ role: "user", content: message, timestamp: now });
  history.messages.push({ role: "assistant", content: reply, timestamp: now });

  // Cap stored history to prevent unbounded growth
  if (history.messages.length > MAX_STORED_MESSAGES) {
    history.messages = history.messages.slice(-MAX_STORED_MESSAGES);
  }

  await history.save();

  return { reply };
}

/**
 * Returns the last 50 messages from a user's chat history.
 * Uses MongoDB $slice projection to transfer only the needed messages over the wire.
 * @param {string} userId
 * @returns {Promise<{ role: string, content: string, timestamp: Date }[]>}
 */
export async function getChatHistory(userId) {
  const history = await ChatHistory.findOne({ user: userId }, { messages: { $slice: -50 } }).lean();
  return history?.messages || [];
}


/**
 * Clears a user's entire chat history.
 * @param {string} userId
 */
export async function clearChatHistory(userId) {
  await ChatHistory.findOneAndUpdate({ user: userId }, { messages: [] }, { upsert: false });
}
