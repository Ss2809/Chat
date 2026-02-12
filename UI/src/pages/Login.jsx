import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await axios.post("https://chat-vxd8.onrender.com/api/user/login", {
        username,
        password,
      });

      if (res.data.accessToken) {
        localStorage.setItem("token", res.data.accessToken);


        navigate("/chat");
      } else {
        setErrorMessage(res.data.message || "Login failed");
      }
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      if (serverMessage) {
        setErrorMessage(serverMessage);
      } else if (error?.code === "ERR_NETWORK") {
        setErrorMessage("Server not reachable. Start the backend on port 8000.");
      } else {
        setErrorMessage("Invalid username or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-bg flex items-center justify-center px-4 py-12">
      {/* Floating Orbs */}
      <div className="floating-orb w-72 h-72 bg-[#00f5ff] top-20 -left-20 fixed" />
      <div className="floating-orb w-96 h-96 bg-[#ff2d7a] bottom-20 -right-32 fixed" style={{ animationDelay: '2s' }} />
      <div className="floating-orb w-48 h-48 bg-[#bf5fff] top-1/2 left-1/3 fixed" style={{ animationDelay: '4s' }} />
      
      <div className="premium-shell w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          {/* Logo/Brand */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f5ff] to-[#ff2d7a] p-[2px]">
              <div className="w-full h-full rounded-2xl bg-[#0c0c14] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="brand-heading text-3xl md:text-4xl text-center mb-2">
            Welcome Back
          </h2>
          <p className="helper-text text-center mb-8 text-sm">
            Enter the void. Your conversations await.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a] rounded-[18px] opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
              <input
                type="text"
                placeholder="Username"
                className="input-field relative"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a] rounded-[18px] opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
              <input
                type="password"
                placeholder="Password"
                className="input-field relative"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Enter
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-5 p-3 rounded-xl bg-[#ff2d7a]/10 border border-[#ff2d7a]/30">
              <p className="text-sm text-[#ff2d7a] text-center">{errorMessage}</p>
            </div>
          )}

          {/* Links */}
          <div className="flex justify-between mt-6 text-sm">
            <span
              onClick={() => navigate("/forgot")}
              className="cursor-pointer link-accent hover:underline transition-all"
            >
              Forgot Password?
            </span>

            <span
              onClick={() => navigate("/signup")}
              className="cursor-pointer text-[#ff2d7a] hover:underline transition-all"
            >
              Create Account
            </span>
          </div>

          {/* Decorative bottom */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#6b6b80]">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a] neon-pulse" />
            Secured with end-to-end encryption
          </div>
        </div>
      </div>
    </div>
  );
}
