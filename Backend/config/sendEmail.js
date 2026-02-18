const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",   
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
   tls: {
    rejectUnauthorized: false,
  },
});

async function sendmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Chat App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.log("Error:", err);
    return false;
  }
}

async function sendrestpass(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Chat App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.log("Error:", err);
    return false;
  }
}

module.exports = { sendmail, sendrestpass };
