import { useState } from "react";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:8000/api/user/forget-password", {
        email,
      });

      alert(res.data.message);

      // for testing (since backend returns token)
      if (res.data.testing) {
        window.location.href = `/reset/${res.data.testing}`;
      }
    } catch (err) {
      alert("Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-bg flex items-center justify-center px-4 py-12">
      <div className="premium-shell w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          <h2 className="brand-heading text-3xl text-center text-white mb-2">
            Forgot Password
          </h2>
          <p className="helper-text text-center mb-6">
            We will email a secure reset link.
          </p>

        <form onSubmit={handleSend} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button className="primary-button w-full">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
