import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import avatarPlaceholder from "../assets/avatar-white.svg";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: "", email: "", bio: "" });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    const res = await axios.get("https://chat-vxd8.onrender.com/api/user/getprofile", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUser(res.data.user);
    setForm({
      username: res.data.user.username,
      email: res.data.user.email,
      bio: res.data.user.bio || ""
    });
  }, [token]);

  useEffect(() => {
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
    setFile(null);
    alert("Profile Photo Updated");
  };

  return (
    <div className="premium-bg min-h-screen text-white">
      {/* Floating Orbs */}
      <div className="floating-orb w-96 h-96 bg-[#00f5ff] top-0 -right-32 fixed opacity-30" />
      <div className="floating-orb w-72 h-72 bg-[#ff2d7a] bottom-0 -left-24 fixed opacity-30" style={{ animationDelay: '2s' }} />
      <div className="floating-orb w-56 h-56 bg-[#bf5fff] top-1/2 left-1/4 fixed opacity-20" style={{ animationDelay: '4s' }} />

      <div className="premium-shell max-w-2xl mx-auto p-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/chat")}
          className="mb-6 flex items-center gap-2 text-[#6b6b80] hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-sm">Back to chats</span>
        </button>

        <div className="glass-card overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-[#00f5ff]/20 via-[#bf5fff]/20 to-[#ff2d7a]/20">
            <div className="absolute inset-0 backdrop-blur-3xl" />
          </div>

          {/* Avatar Section */}
          <div className="relative px-6 pb-6">
            <div className="absolute -top-16 left-6">
              <div className="relative">
                <div className="p-[3px] rounded-full bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a]">
                  <img
                    src={user?.profilePhoto || avatarPlaceholder}
                    className="w-28 h-28 rounded-full object-cover border-4 border-[#0c0c14]"
                    alt="Profile"
                  />
                </div>
                <label className="absolute bottom-1 right-1 w-8 h-8 bg-[#00f5ff] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-[#00f5ff]/30">
                  <svg className="w-4 h-4 text-[#050508]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    accept="image/*"
                  />
                </label>
              </div>
            </div>

            <div className="pt-16 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{user?.username}</h1>
                <p className="text-[#6b6b80] text-sm">{user?.email}</p>
              </div>
              {file && (
                <button
                  onClick={uploadImage}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a] text-[#050508] font-bold text-sm hover:scale-105 transition-transform"
                >
                  Upload Photo
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-white/5">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-4 py-3 text-sm font-medium transition-all relative ${
                  activeTab === "profile" ? "text-white" : "text-[#6b6b80] hover:text-white"
                }`}
              >
                Profile Info
                {activeTab === "profile" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`px-4 py-3 text-sm font-medium transition-all relative ${
                  activeTab === "security" ? "text-white" : "text-[#6b6b80] hover:text-white"
                }`}
              >
                Security
                {activeTab === "security" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a]" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "profile" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div>
                  <label className="block text-sm text-[#6b6b80] mb-2">Username</label>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#00f5ff] to-[#bf5fff] rounded-[18px] opacity-0 group-focus-within:opacity-30 blur-xl transition-opacity duration-500" />
                    <input
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="input-field relative"
                      placeholder="Username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#6b6b80] mb-2">Email</label>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#bf5fff] to-[#ff2d7a] rounded-[18px] opacity-0 group-focus-within:opacity-30 blur-xl transition-opacity duration-500" />
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-field relative"
                      placeholder="Email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#6b6b80] mb-2">Bio</label>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#ff2d7a] to-[#00f5ff] rounded-[18px] opacity-0 group-focus-within:opacity-30 blur-xl transition-opacity duration-500" />
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      className="input-field relative min-h-[120px] resize-y"
                      placeholder="Tell something about yourself..."
                    />
                  </div>
                </div>

                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="primary-button w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Changes
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="p-4 rounded-2xl bg-[#ff2d7a]/5 border border-[#ff2d7a]/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ff2d7a]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#ff2d7a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-white mb-1">Change Password</h3>
                      <p className="text-sm text-[#6b6b80]">Update your password to keep your account secure</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#6b6b80] mb-2">Current Password</label>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#ff2d7a] to-[#bf5fff] rounded-[18px] opacity-0 group-focus-within:opacity-30 blur-xl transition-opacity duration-500" />
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="input-field relative"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#6b6b80] mb-2">New Password</label>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#bf5fff] to-[#00f5ff] rounded-[18px] opacity-0 group-focus-within:opacity-30 blur-xl transition-opacity duration-500" />
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field relative"
                    />
                  </div>
                </div>

                <button
                  onClick={changePassword}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#ff2d7a]/10 hover:bg-[#ff2d7a]/20 border border-[#ff2d7a]/30 text-[#ff2d7a] font-bold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Update Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[#6b6b80] text-xs flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a] neon-pulse" />
            Your data is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}
