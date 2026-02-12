import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const res = await axios.post("https://chat-vxd8.onrender.com/api/user/signup", {  
        username,
        email,
        password,
      });

      alert(res.data.message);

      if (res.data.message.includes("OTP")) {
        localStorage.setItem("verifyEmail", email);
        window.location.href = "/verify";
      }
    } catch (error) {
      console.error(error);
      alert("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-bg flex items-center justify-center px-4 py-12">
      {/* Floating Orbs */}
      <div className="floating-orb w-80 h-80 bg-[#ff2d7a] top-10 -right-20 fixed" />
      <div className="floating-orb w-64 h-64 bg-[#00f5ff] bottom-10 -left-16 fixed" style={{ animationDelay: '3s' }} />
      <div className="floating-orb w-40 h-40 bg-[#bf5fff] top-1/3 right-1/4 fixed" style={{ animationDelay: '1s' }} />

      <div className="premium-shell w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          {/* Logo/Brand */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff2d7a] to-[#bf5fff] p-[2px]">
              <div className="w-full h-full rounded-2xl bg-[#0c0c14] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="brand-heading text-3xl md:text-4xl text-center mb-2">
            Join the Void
          </h2>
          <p className="helper-text text-center mb-8 text-sm">
            Create your account and start connecting.
          </p>

          <form onSubmit={handleSendOTP} className="space-y-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#bf5fff] to-[#ff2d7a] rounded-[20px] opacity-0 group-focus-within:opacity-50 blur-xl transition-opacity duration-500" />
              <input
                className="input-field relative"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00f5ff] to-[#bf5fff] rounded-[20px] opacity-0 group-focus-within:opacity-50 blur-xl transition-opacity duration-500" />
              <input
                className="input-field relative"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ff2d7a] to-[#00f5ff] rounded-[20px] opacity-0 group-focus-within:opacity-50 blur-xl transition-opacity duration-500" />
              <input
                className="input-field relative"
                placeholder="Create password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Sending OTP...
                </>
              ) : (
                <>
                  Get Started
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <span className="text-sm text-[#6b6b80]">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/")}
                className="cursor-pointer link-accent hover:underline"
              >
                Sign in
              </span>
            </span>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-[#00f5ff]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#00f5ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-[10px] text-[#6b6b80]">Encrypted</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-[#ff2d7a]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#ff2d7a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-[10px] text-[#6b6b80]">Real-time</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-[#bf5fff]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#bf5fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-[10px] text-[#6b6b80]">Connect</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
