const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendmail = async (toEmail, subject, htmltemplate) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: toEmail,
      subject: subject,
      html: htmltemplate,
    });

    if (error) {
      console.error("Email error:", error);
      return false;
    }

    console.log("Email sent successfully:", data);
    return true;
  } catch (err) {
    console.error("Email error :-", err);
    return false;
  }
};

const sendrestpass = async (toEmail, subject, htmltemplate) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: toEmail,
      subject: subject,
      html: htmltemplate,
    });

    if (error) {
      console.error("Reset email error:", error);
      return false;
    }

    console.log("Reset email sent:", data);
    return true;
  } catch (err) {
    console.error("Email error :-", err);
    return false;
  }
};

module.exports = { sendmail, sendrestpass };