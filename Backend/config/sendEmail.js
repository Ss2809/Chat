const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",   
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Chat App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.log("Error:", err);
  }
}

async function sendrestpass(to, subject, textdata) {
  try {
    const info = await transporter.sendMail({
      from: `"Chat App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      textdata,
    });

    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.log("Error:", err);
  }
}

module.exports = {sendMail,sendrestpass};
