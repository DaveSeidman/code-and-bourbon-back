const getAdminEmails = () => {
  const rawValue =
    process.env.CHAT_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "";

  return rawValue
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const isChatAdmin = (member) => {
  const email = member?.email?.toLowerCase();

  return Boolean(email && getAdminEmails().includes(email));
};

const canAccessChat = (member) =>
  Boolean(member && (member.chatApproved || isChatAdmin(member)));

const serializeMember = (member) => {
  if (!member) {
    return null;
  }

  return {
    _id: member._id,
    displayName: member.displayName,
    email: member.email,
    profilePicture: member.profilePicture,
    chatApproved: Boolean(member.chatApproved),
    chatApprovedAt: member.chatApprovedAt,
    canUseChat: canAccessChat(member),
    isChatAdmin: isChatAdmin(member),
  };
};

module.exports = {
  canAccessChat,
  isChatAdmin,
  serializeMember,
};
