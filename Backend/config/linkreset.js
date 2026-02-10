const resetTemplate = (token) => {
  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:5173";
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const resetUrl = `${normalizedBaseUrl}/reset/${token}`;

  return `
<h2>Chat Application</h2>
<p>You requested to reset your password.</p>

<a href="${resetUrl}"
   style="
     display:inline-block;
     padding:12px 25px;
     background:#4f46e5;
     color:#ffffff;
     text-decoration:none;
     border-radius:6px;
     font-weight:bold;
   ">
   Reset Password
</a>

<p>This link is valid for 15 minutes.</p>
<p>If you did not request this, ignore this email.</p>
`;
};

module.exports = resetTemplate;