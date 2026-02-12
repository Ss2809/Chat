import { useEffect, useState } from "react";
import axios from "axios";
import avatarPlaceholder from "../assets/avatar-white.svg";

export default function StartChat({ refreshChats }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://chat-vxd8.onrender.com/api/user/all", {
       headers: {
  Authorization: `Bearer ${localStorage.getItem("token")}`
}
,
      });
       
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.log("User fetch failed:", err.response?.data || err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (otherId) => {
    try {
      await axios.post(
        "https://chat-vxd8.onrender.com/api/chat/chatcreate",
        { Other_id: otherId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      refreshChats();
      setIsOpen(false);
    } catch (err) {
      console.log("Start chat error:", err.response?.data || err);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a] text-[#050508] font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#00f5ff]/20"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Chat
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 backdrop-blur-2xl bg-[#0c0c14]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="p-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-[#00f5ff]">Start New Chat</h3>
          </div>

          {loading && (
            <div className="p-4 text-center">
              <div className="w-6 h-6 mx-auto border-2 border-[#00f5ff]/30 border-t-[#00f5ff] rounded-full animate-spin" />
            </div>
          )}

          {!loading && users.length === 0 && (
            <p className="p-4 text-[#6b6b80] text-sm text-center">No users found</p>
          )}

          <div className="max-h-48 overflow-y-auto">
            {!loading &&
              users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => startChat(u._id)}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <div className="relative">
                    <img
                      src={u.profilePhoto || avatarPlaceholder}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#00f5ff]/50 transition-all"
                      alt={u.username}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{u.username}</p>
                    <p className="text-xs text-[#6b6b80] truncate">{u.bio || "No bio"}</p>
                  </div>
                  <svg className="w-5 h-5 text-[#6b6b80] group-hover:text-[#00f5ff] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              ))}
          </div>

          <div className="p-2 border-t border-white/5">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2 text-sm text-[#6b6b80] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
