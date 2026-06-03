const nodemailer = require("nodemailer");

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.log("Email fallback:", { to, subject, text, html });
    return false;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@skillsphere.com",
    to,
    subject,
    text,
    html,
  });

  return true;
};

module.exports = {
  sendEmail,
};
