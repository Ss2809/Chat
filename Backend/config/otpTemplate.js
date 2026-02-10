const otpTemplate = (otp) => `
<h2>Chat Application</h2>
<p>Your OTP is:</p>
<h1 style="color:#4f46e5;">${otp}</h1>
<p>This OTP is valid for 10 minutes.</p>
`;

module.exports = otpTemplate;
