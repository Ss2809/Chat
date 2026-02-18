import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const email = localStorage.getItem("verifyEmail");
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("https://chat-vxd8.onrender.com/api/user/verify-otp", {
        email,
        otp,
      });

      alert(res.data.message);

      if (res.data.success) {
        localStorage.removeItem("verifyEmail");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-bg flex items-center justify-center px-4 py-12">
      {/* Floating Orbs */}
      <div className="floating-orb w-64 h-64 bg-[#bf5fff] top-1/4 -left-16 fixed" />
      <div className="floating-orb w-72 h-72 bg-[#00f5ff] bottom-1/4 -right-20 fixed" style={{ animationDelay: '2s' }} />

      <div className="premium-shell w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#bf5fff] to-[#00f5ff] p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0c0c14] flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="brand-heading text-3xl text-center mb-2">
            Verify Code
          </h2>
          <p className="helper-text text-center mb-2 text-sm">
            Enter the 6-digit code sent to
          </p>
          <p className="text-center text-[#00f5ff] text-sm mb-8 font-mono">
            {email}
          </p>

          <form onSubmit={handleVerify} className="space-y-5">
            <div className="relative">
              <input
                className="input-field otp-field text-2xl py-4"
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
              <div className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-gradient-to-r from-[#00f5ff] via-[#bf5fff] to-[#ff2d7a] opacity-50" />
            </div>

            <button 
              className="primary-button w-full flex items-center justify-center gap-2"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Account
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span
              onClick={() => navigate("/")}
              className="cursor-pointer text-sm text-[#6b6b80] hover:text-white transition-colors"
            >
              ← Back to Login
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
