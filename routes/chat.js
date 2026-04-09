const express = require("express");

const Member = require("../models/member");
const {
  sendChatAccessRequestNotification,
} = require("../utils/chatNotifications");
const { getMemberRoom, getRecentChatMessages } = require("../utils/chat");
const {
  canAccessChat,
  isChatAdmin,
  serializeMember,
} = require("../utils/memberAccess");
const REQUEST_NOTIFICATION_COOLDOWN_MS = 1000 * 60 * 30;

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return next();
};

const requireChatAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!canAccessChat(req.user)) {
    return res.status(403).json({ error: "Chat access denied" });
  }

  return next();
};

const requireChatAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!isChatAdmin(req.user)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  return next();
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findMemberByIdentifier = async (identifier) => {
  const trimmedIdentifier = identifier.trim();

  if (!trimmedIdentifier) {
    return null;
  }

  if (/^[a-f0-9]{24}$/i.test(trimmedIdentifier)) {
    const memberById = await Member.findById(trimmedIdentifier);

    if (memberById) {
      return memberById;
    }
  }

  return Member.findOne({
    email: new RegExp(`^${escapeRegExp(trimmedIdentifier)}$`, "i"),
  });
};

module.exports = function createChatRoutes({ io }) {
  const router = express.Router();

  router.get("/messages", requireChatAccess, async (req, res) => {
    try {
      const messages = await getRecentChatMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error loading chat messages:", error);
      res.status(500).json({ error: "Unable to load chat messages" });
    }
  });

  router.get("/members", requireChatAdmin, async (req, res) => {
    try {
      const members = await Member.find().sort({ displayName: 1, email: 1 });
      res.json(members.map(serializeMember));
    } catch (error) {
      console.error("Error loading chat members:", error);
      res.status(500).json({ error: "Unable to load members" });
    }
  });

  router.post("/request-access", requireAuth, async (req, res) => {
    try {
      const member = await Member.findById(req.user._id);

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      if (canAccessChat(member)) {
        return res.json({
          member: serializeMember(member),
          message: "You already have chat access.",
          requested: false,
        });
      }

      const now = new Date();
      const lastNotifiedAt = member.chatAccessRequestNotifiedAt
        ? member.chatAccessRequestNotifiedAt.getTime()
        : 0;
      const shouldNotify =
        !lastNotifiedAt ||
        now.getTime() - lastNotifiedAt >= REQUEST_NOTIFICATION_COOLDOWN_MS;

      console.log(
        `[${now.toISOString()}] CHAT ACCESS REQUEST RECEIVED: ${member.displayName || "Unknown"} (${member.email}) count=${(member.chatAccessRequestCount || 0) + 1}`,
      );

      member.chatAccessRequestedAt = now;
      member.chatAccessRequestCount = (member.chatAccessRequestCount || 0) + 1;

      if (shouldNotify) {
        member.chatAccessRequestNotifiedAt = now;
      }

      await member.save();

      const notificationResult = shouldNotify
        ? await sendChatAccessRequestNotification({
            member,
            requestCount: member.chatAccessRequestCount,
            requestedAt: now,
          })
        : {
            delivered: false,
            reason: "Recent request already notified. Cooldown still active.",
          };

      return res.json({
        member: serializeMember(member),
        message: shouldNotify
          ? notificationResult.delivered
            ? "Knock received. The gatekeeper has been pinged."
            : "Knock received. Request logged for review."
          : "Request already queued. Sit tight.",
        notification: notificationResult,
        requested: true,
      });
    } catch (error) {
      console.error("Error requesting chat access:", error);
      return res.status(500).json({ error: "Unable to request chat access" });
    }
  });

  router.post(
    "/members/access",
    requireAuth,
    requireChatAdmin,
    async (req, res) => {
      try {
        const { identifier, approved, clearRequest } = req.body;

        if (
          typeof identifier !== "string" ||
          typeof approved !== "boolean" ||
          (clearRequest !== undefined && typeof clearRequest !== "boolean")
        ) {
          return res.status(400).json({
            error: "identifier and approved are required",
          });
        }

        const member = await findMemberByIdentifier(identifier);

        if (!member) {
          return res.status(404).json({ error: "Member not found" });
        }

        member.chatApproved = approved;
        member.chatApprovedAt = approved ? new Date() : null;
        member.chatApprovedBy = approved ? req.user._id : null;

        if (approved || clearRequest) {
          member.chatAccessRequestedAt = null;
          member.chatAccessRequestNotifiedAt = null;
        }

        await member.save();

        const payload = serializeMember(member);

        if (!approved && !payload.isChatAdmin && io) {
          io.to(getMemberRoom(member._id)).emit("chat:access-revoked");
          io.in(getMemberRoom(member._id)).disconnectSockets(true);
        }

        return res.json(payload);
      } catch (error) {
        console.error("Error updating chat access:", error);
        return res.status(500).json({ error: "Unable to update chat access" });
      }
    },
  );

  return router;
};
