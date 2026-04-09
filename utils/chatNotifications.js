const nodemailer = require("nodemailer");

const getEnv = (...keys) => keys.find((key) => process.env[key]) || null;

const getRecipients = () => {
  const envKey =
    getEnv(
      "CHAT_NOTIFY_EMAILS",
      "CHAT_NOTIFY_EMAIL",
      "NOTIFY_EMAILS",
      "NOTIFY_EMAIL",
    ) || null;
  const rawRecipients = envKey
    ? process.env[envKey]
    : process.env.CHAT_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "";

  return rawRecipients
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
};

const getTransportConfig = () => {
  const hostKey = getEnv("CHAT_SMTP_HOST", "SMTP_HOST");
  const portKey = getEnv("CHAT_SMTP_PORT", "SMTP_PORT");
  const userKey = getEnv("CHAT_SMTP_USER", "SMTP_USER");
  const passKey = getEnv("CHAT_SMTP_PASS", "SMTP_PASS");
  const fromKey = getEnv("CHAT_SMTP_FROM", "SMTP_FROM");
  const secureKey = getEnv("CHAT_SMTP_SECURE", "SMTP_SECURE");

  const host = hostKey ? process.env[hostKey] : "";
  const port = Number(portKey ? process.env[portKey] : 587);
  const user = userKey ? process.env[userKey] : "";
  const pass = passKey ? process.env[passKey] : "";
  const from = fromKey ? process.env[fromKey] : user;
  const secure =
    secureKey && process.env[secureKey] !== undefined
      ? process.env[secureKey] === "true"
      : port === 465;

  return {
    configured: Boolean(host && from && getRecipients().length),
    from,
    host,
    pass,
    port,
    secure,
    user,
  };
};

const sendChatAccessRequestNotification = async ({
  member,
  requestCount,
  requestedAt,
}) => {
  const requestedAtIso = requestedAt.toISOString();

  console.log(
    `[${requestedAtIso}] CHAT ACCESS REQUEST: ${member.displayName || "Unknown"} (${member.email}) requested chat access. count=${requestCount}`,
  );

  const recipients = getRecipients();
  const transportConfig = getTransportConfig();

  if (!transportConfig.configured) {
    return {
      delivered: false,
      reason: "Chat notification email is not configured.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      auth: transportConfig.user
        ? {
            user: transportConfig.user,
            pass: transportConfig.pass,
          }
        : undefined,
      host: transportConfig.host,
      port: transportConfig.port,
      secure: transportConfig.secure,
    });

    await transporter.sendMail({
      from: transportConfig.from,
      subject: `Code & Bourbon chat access request: ${member.displayName || member.email}`,
      text: [
        `${member.displayName || "A member"} requested chat access.`,
        "",
        `Name: ${member.displayName || "Unknown"}`,
        `Email: ${member.email || "Unknown"}`,
        `Member ID: ${member._id}`,
        `Requested At: ${requestedAtIso}`,
        `Request Count: ${requestCount}`,
        "",
        "Approve them from the browser console with:",
        `approveChat("${member.email}")`,
      ].join("\n"),
      to: recipients.join(", "),
    });

    return {
      delivered: true,
      reason: `Notification email sent to ${recipients.join(", ")}.`,
    };
  } catch (error) {
    console.error("Error sending chat access request email:", error);

    return {
      delivered: false,
      reason: "Chat notification email failed to send.",
    };
  }
};

module.exports = {
  sendChatAccessRequestNotification,
};
