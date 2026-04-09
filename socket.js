const passport = require("passport");
const { Server } = require("socket.io");

const ChatMessage = require("./models/chatMessage");
const Member = require("./models/member");
const {
  CHAT_ROOM,
  formatChatMessage,
  getMemberRoom,
  getRecentChatMessages,
  normalizeChatMessage,
} = require("./utils/chat");
const { canAccessChat } = require("./utils/memberAccess");

const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

module.exports = function createChatSocketServer({
  server,
  sessionMiddleware,
  corsOrigins,
}) {
  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.use(wrap(sessionMiddleware));
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));
  io.use(async (socket, next) => {
    try {
      const memberId = socket.request.user?._id;

      if (!memberId) {
        return next(new Error("Authentication required"));
      }

      const member = await Member.findById(memberId);

      if (!canAccessChat(member)) {
        return next(new Error("Chat access denied"));
      }

      socket.request.user = member;
      return next();
    } catch (error) {
      return next(error);
    }
  });

  io.on("connection", async (socket) => {
    const member = socket.request.user;

    socket.join(CHAT_ROOM);
    socket.join(getMemberRoom(member._id));

    try {
      socket.emit("chat:history", await getRecentChatMessages());
    } catch (error) {
      console.error("Error sending chat history:", error);
    }

    socket.on("chat:send", async (rawMessage, acknowledgement) => {
      const respond =
        typeof acknowledgement === "function" ? acknowledgement : () => {};

      try {
        const currentMember = await Member.findById(member._id);

        if (!canAccessChat(currentMember)) {
          respond({ ok: false, error: "Chat access denied." });
          socket.emit("chat:access-revoked");
          socket.disconnect(true);
          return;
        }

        const { error, text } = normalizeChatMessage(rawMessage);

        if (error) {
          respond({ ok: false, error });
          return;
        }

        const savedMessage = await ChatMessage.create({
          senderId: currentMember._id,
          senderDisplayName: currentMember.displayName || currentMember.email,
          text,
        });

        io.to(CHAT_ROOM).emit(
          "chat:message",
          formatChatMessage(savedMessage.toObject()),
        );
        respond({ ok: true });
      } catch (error) {
        console.error("Error sending chat message:", error);
        respond({ ok: false, error: "Unable to send message right now." });
      }
    });
  });

  return io;
};
