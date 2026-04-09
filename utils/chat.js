const ChatMessage = require("../models/chatMessage");

const CHAT_ROOM = "chat-room";
const MAX_CHAT_MESSAGE_LENGTH = 500;
const RECENT_CHAT_MESSAGE_LIMIT = 25;

const getMemberRoom = (memberId) => `member:${memberId}`;

const formatChatMessage = (message) => ({
  id: String(message._id),
  senderId: String(message.senderId),
  senderDisplayName: message.senderDisplayName,
  text: message.text,
  createdAt: message.createdAt,
});

const getRecentChatMessages = async (limit = RECENT_CHAT_MESSAGE_LIMIT) => {
  const messages = await ChatMessage.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse().map(formatChatMessage);
};

const normalizeChatMessage = (message) => {
  if (typeof message !== "string") {
    return { error: "Chat messages must be plain text strings." };
  }

  const text = message.trim();

  if (!text) {
    return { error: "Chat messages cannot be empty." };
  }

  if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
    return {
      error: `Chat messages must be ${MAX_CHAT_MESSAGE_LENGTH} characters or fewer.`,
    };
  }

  return { text };
};

module.exports = {
  CHAT_ROOM,
  MAX_CHAT_MESSAGE_LENGTH,
  RECENT_CHAT_MESSAGE_LIMIT,
  formatChatMessage,
  getMemberRoom,
  getRecentChatMessages,
  normalizeChatMessage,
};
