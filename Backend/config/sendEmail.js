const nodemailer = require("nodemailer");

// create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
 secure: true,
  port: 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
   logger: true,
    debug: true,
});

const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;

async function sendMail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({

    
      from: smtpFrom ? `"Chat App" <${smtpFrom}>` : "Chat App",
      to,
      subject,
      text,
      html,

    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.log("Error:", error);
    return false;
  }
}

const sendmail = (to, subject, html) => sendMail({ to, subject, html });
const sendrestpass = (to, subject, html) => sendMail({ to, subject, html });

module.exports = { sendmail, sendrestpass };
