const nodemailer = require("nodemailer");

const Transport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendmail = async (to, subject, html) => {
  try {
    const data = {
      from: `"Chat Application" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    await Transport.sendMail(data);
    console.log("Otp mail sent succfullt");
  } catch (error) {
    console.log("error email :-", error);
  }
};

const sendrestpass = async(to,subject,html)=>{
   try {
    const data = {
      from: `"Chat Application" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    await Transport.sendMail(data);
    console.log("Otp mail sent succfullt");
  } catch (error) {
    console.log("error email :-", error);
  }
};
module.exports = {sendmail,sendrestpass};
