import { useState } from "react";
import axios from "axios";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const email = localStorage.getItem("verifyEmail");

  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:8000/api/user/verify-otp", {
        email,
        otp,
      });

      alert(res.data.message);

      if (res.data.message.includes("verified")) {
        localStorage.removeItem("verifyEmail");
        window.location.href = "/login";
      }
    } catch (err) {
      alert("Invalid OTP");
    }
  };

  return (
    <div className="premium-bg flex items-center justify-center px-4 py-12">
      <div className="premium-shell w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          <h2 className="brand-heading text-3xl text-center text-white mb-2">
            Verify OTP
          </h2>
          <p className="helper-text text-center mb-6">
            Enter the 6-digit code sent to your email.
          </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            className="input-field otp-field"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <button className="primary-button w-full">
            Verify
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
