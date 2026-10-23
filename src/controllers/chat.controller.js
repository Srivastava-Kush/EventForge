import * as chatService from "../services/chat.service.js";
import { sendResponse } from "../utils/sendResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

/** POST /api/chat — send a message, get a reply */
export async function sendMessage(req, res) {
  const { message, eventId } = req.body;
  const { reply } = await chatService.sendMessage(req.user._id, message, { eventId });
  return sendResponse(res, HTTP_STATUS.OK, true, { reply });
}

/** GET /api/chat/history — last 50 messages */
export async function getHistory(req, res) {
  const messages = await chatService.getChatHistory(req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, { messages });
}

