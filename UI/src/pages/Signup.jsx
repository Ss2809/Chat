import { useState } from "react";
import axios from "axios";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div className="premium-shell w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          <h2 className="brand-heading text-3xl md:text-4xl text-center text-white mb-2">
            Create Account
          </h2>
          <p className="helper-text text-center mb-6">
            Join the private, premium messaging experience.
          </p>

        <form onSubmit={handleSendOTP} className="space-y-4">
          <input
            className="input-field"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            className="input-field"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="input-field"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="primary-button w-full">
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
