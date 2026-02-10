import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import avatarPlaceholder from "../assets/avatar-white.svg";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: "", email: "" });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    const res = await axios.get("https://chat-vxd8.onrender.com/api/user/getprofile", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUser(res.data.user);
    setForm({
      username: res.data.user.username,
      email: res.data.user.email
    });
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async () => {
    setLoading(true);
    await axios.post("https://chat-vxd8.onrender.com/api/user/profileupdate", form, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert("Profile Updated");
    fetchProfile();
    setLoading(false);
  };

  const changePassword = async () => {
    if (!oldPassword || !newPassword) return alert("Fill both fields");

    await axios.post("https://chat-vxd8.onrender.com/api/user/changepassowrd",
      { oldpassword: oldPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Password Changed");
    setOldPassword("");
    setNewPassword("");
  };

  const uploadImage = async () => {
    if (!file) return alert("Select an image");

    const formData = new FormData();
    formData.append("profile", file);

    await axios.post("https://chat-vxd8.onrender.com/api/user/uploadprofile", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });

    fetchProfile();
    alert("Profile Photo Updated");
  };

  return (
    <div className="premium-bg min-h-screen text-white p-4">
      <div className="premium-shell max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/chat")}
          className="link-accent mb-6 inline-flex items-center gap-2 text-sm"
        >
          <span aria-hidden>←</span>
          Back to chats
        </button>

        <div className="glass-card p-6 md:p-8">

        {/* Profile Photo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={user?.profilePhoto || avatarPlaceholder}
            className="w-28 h-28 rounded-full object-cover mb-3 ring-2 ring-teal-400/40 shadow-lg shadow-teal-500/20"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-slate-200 hover:file:bg-white/20"
          />
          <button
            onClick={uploadImage}
            className="primary-button w-auto px-5 py-2 mt-3"
          >
            Update Photo
          </button>
        </div>

        {/* Profile Info */}
        <div className="space-y-3">
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="input-field"
            placeholder="Username"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
            placeholder="Email"
          />
          <button
            onClick={updateProfile}
            disabled={loading}
            className="primary-button w-full"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* Change Password */}
        <div className="mt-6 border-t border-white/10 pt-4 space-y-3">
          <p className="mb-2 helper-text">Change Password</p>

          <input
            type="password"
            placeholder="Old password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="input-field"
          />

          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
          />

          <button
            onClick={changePassword}
            className="secondary-button w-full text-red-300 border-red-400/30 hover:bg-red-500/10"
          >
            Change Password
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
