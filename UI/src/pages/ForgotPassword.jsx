import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("https://chat-vxd8.onrender.com/api/user/forget-password", {
        email,
      });

      setSent(true);
      alert(res.data.message);

      if (res.data.testing) {
        window.location.href = `/reset/${res.data.testing}`;
      }
    } catch (error) {
      console.error(error);
      alert("Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-bg flex items-center justify-center px-4 py-12">
      {/* Floating Orbs */}
      <div className="floating-orb w-72 h-72 bg-[#ff2d7a] top-20 -right-24 fixed" />
      <div className="floating-orb w-56 h-56 bg-[#00f5ff] bottom-32 -left-20 fixed" style={{ animationDelay: '1.5s' }} />

      <div className="premium-shell w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff2d7a] to-[#00f5ff] p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0c0c14] flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="brand-heading text-3xl text-center mb-2">
            Reset Password
          </h2>
          <p className="helper-text text-center mb-8 text-sm">
            Enter your email and we'll send you a secure reset link.
          </p>

          {!sent ? (
            <form onSubmit={handleSend} className="space-y-5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#ff2d7a] to-[#00f5ff] rounded-[20px] opacity-0 group-focus-within:opacity-50 blur-xl transition-opacity duration-500" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="input-field relative"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button 
                className="primary-button w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#b8ff00]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#b8ff00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-medium mb-2">Check your inbox!</p>
              <p className="text-[#6b6b80] text-sm">Reset link sent to {email}</p>
            </div>
          )}

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
