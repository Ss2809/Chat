import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `https://chat-vxd8.onrender.com/api/user/reset/${token}`,
        { newPassword }
      );

      alert(res.data.message);

      if (res.data.message.includes("success")) {
        window.location.href = "/login";
      }
    } catch (err) {
      alert("Reset failed");
    }
  };

  return (
    <div className="premium-bg flex items-center justify-center px-4 py-12">
      <div className="premium-shell w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          <h2 className="brand-heading text-3xl text-center text-white mb-2">
            Reset Password
          </h2>
          <p className="helper-text text-center mb-6">
            Choose a stronger password to protect your chats.
          </p>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="Enter new password"
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <button className="primary-button w-full">
            Reset Password
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
