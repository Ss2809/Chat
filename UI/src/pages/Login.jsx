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

      const res = await axios.post("http://localhost:8000/api/user/login", {
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
      <div className="premium-shell w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          <h2 className="brand-heading text-3xl md:text-4xl text-center text-white mb-2">
            Welcome Back
          </h2>
          <p className="helper-text text-center mb-6">
            Secure access to your private conversations.
          </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {errorMessage && (
          <p className="mt-4 text-sm text-red-300 text-center">{errorMessage}</p>
        )}

        {/* 🔹 Links */}
        <div className="flex justify-between mt-4 text-sm helper-text">
          <span
            onClick={() => navigate("/forgot")}
            className="cursor-pointer link-accent"
          >
            Forgot Password?
          </span>

          <span
            onClick={() => navigate("/signup")}
            className="cursor-pointer link-accent"
          >
            Create Account
          </span>
        </div>
        </div>
      </div>
    </div>
  );
}
