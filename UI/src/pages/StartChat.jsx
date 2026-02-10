import { useEffect, useState } from "react";
import axios from "axios";
import avatarPlaceholder from "../assets/avatar-white.svg";

export default function StartChat({ refreshChats }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.log("Start chat error:", err.response?.data || err);
    }
  };

  return (
    <div className="p-3 border-b border-slate-700">
      <h3 className="text-sky-400 mb-2 font-semibold">Start New Chat</h3>

      {loading && <p className="text-slate-400 text-sm">Loading users...</p>}

      {!loading && users.length === 0 && (
        <p className="text-slate-400 text-sm">No users found</p>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {!loading &&
          users.map((u) => (
            <div
              key={u._id}
              onClick={() => startChat(u._id)}
              className="flex items-center gap-3 p-2 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
            >
              <img
                src={u.profilePhoto || avatarPlaceholder}
                className="w-8 h-8 rounded-full"
              />
              <p>{u.username}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
