import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `https://chat-vxd8.onrender.com/api/user/reset/${token}`,
        { newPassword }
      );

      alert(res.data.message);

      if (res.data.message.includes("success")) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error(error);
      alert("Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-bg flex items-center justify-center px-4 py-12">
      {/* Floating Orbs */}
      <div className="floating-orb w-80 h-80 bg-[#b8ff00] top-10 -left-28 fixed opacity-30" />
      <div className="floating-orb w-64 h-64 bg-[#bf5fff] bottom-20 -right-16 fixed" style={{ animationDelay: '2s' }} />

      <div className="premium-shell w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#b8ff00] to-[#00f5ff] p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0c0c14] flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="brand-heading text-3xl text-center mb-2">
            New Password
          </h2>
          <p className="helper-text text-center mb-8 text-sm">
            Choose a strong password to secure your account.
          </p>

          <form onSubmit={handleReset} className="space-y-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#b8ff00] to-[#00f5ff] rounded-[20px] opacity-0 group-focus-within:opacity-50 blur-xl transition-opacity duration-500" />
              <input
                type="password"
                placeholder="New password"
                className="input-field relative"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00f5ff] to-[#bf5fff] rounded-[20px] opacity-0 group-focus-within:opacity-50 blur-xl transition-opacity duration-500" />
              <input
                type="password"
                placeholder="Confirm password"
                className="input-field relative"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {newPassword && confirmPassword && (
              <div className={`flex items-center gap-2 text-sm ${newPassword === confirmPassword ? 'text-[#b8ff00]' : 'text-[#ff2d7a]'}`}>
                {newPassword === confirmPassword ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Passwords match
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Passwords don't match
                  </>
                )}
              </div>
            )}

            <button 
              className="primary-button w-full flex items-center justify-center gap-2"
              disabled={loading || newPassword !== confirmPassword}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  Set New Password
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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
