const nodemailer = require("nodemailer");

// create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
 host: process.env.MAIL_HOST,
  port: 587,
  auth: {
    user: process.env.SMTP_USER , 
    pass: process.env.SMTP_PASS, 
  },
});


async function sendMail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: '"Smart Portal" <your_email@gmail.com>',
      to: to,
      subject: subject,
      text: text,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.log("Error:", error);
  }
}

module.exports = sendMail;
