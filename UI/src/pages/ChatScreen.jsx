import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

export default function ChatScreen() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [socket, setSocket] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [typingUser, setTypingUser] = useState("");

  const token = localStorage.getItem("token");
  const myId = JSON.parse(atob(token.split(".")[1]))._id;

  const fetchMessages = useCallback(async () => {
    const res = await axios.get(`https://chat-vxd8.onrender.com/api/chat/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages(res.data);
  }, [chatId, token]);

  const fetchChatUser = useCallback(async () => {
    const res = await axios.get("https://chat-vxd8.onrender.com/api/chat/chatlist", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const chat = res.data.userchat.find((c) => c._id === chatId);
    const other = chat.users.find((u) => u._id !== myId);
    setChatUser(other);
  }, [chatId, myId, token]);

  /* 🔌 Connect socket */
  useEffect(() => {
    const newSocket = io("https://chat-vxd8.onrender.com", {
      auth: { token },
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [token]);

  /* 🧩 Join chat + socket listeners */
  useEffect(() => {
    if (!socket) return;

    socket.emit("joinChat", chatId);
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });
    socket.off("onlineUsers");

    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("showTyping", (username) => {
      setTypingUser(username);
    });

    socket.on("hideTyping", () => {
      setTypingUser("");
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("showTyping");
      socket.off("hideTyping");
    };
  }, [socket, chatId]);

  /* 📥 Load messages + user */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
    fetchChatUser();
  }, [fetchMessages, fetchChatUser]);

  /* 📜 Auto scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* 📤 Send message */
  const sendMessage = () => {
    if (!newMsg.trim() || !socket) return;

    socket.emit("sendMessage", {
      chatId,
      text: newMsg,
    });

    socket.emit("hideTyping", chatId);
    setNewMsg("");
  };

  const clearChat = async () => {
    if (!window.confirm("Clear all messages in this chat?")) return;
    
    try {
      await axios.delete(`https://chat-vxd8.onrender.com/api/chat/deletechat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages([]);
    } catch (err) {
      console.log("Clear chat error:", err);
    }
  };

  const isOnline = onlineUsers.includes(chatUser?._id);

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      
      {/* 🔹 Top bar - Premium Header */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>
        
        <div className="relative flex items-center justify-between p-4">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/chat")}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="relative">
              <img
                onClick={() => setShowProfile(true)}
                src={chatUser?.profilePhoto || "https://i.pravatar.cc/150"}
                className="w-11 h-11 rounded-full cursor-pointer object-cover ring-2 ring-purple-500/50 hover:ring-purple-500 transition-all shadow-lg shadow-purple-500/20"
                alt={chatUser?.username}
              />
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900"></div>
              )}
            </div>

            <div>
              <p className="text-white font-semibold">
                {chatUser?.username || "Loading..."}
              </p>
              <p className="text-xs flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-emerald-400">Online</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                    <span className="text-slate-400">Offline</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right side - Clear Chat */}
          <button
            onClick={clearChat}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Chat
          </button>
        </div>
      </div>

      {/* 🔹 Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">No messages yet</p>
            <p className="text-slate-500 text-xs mt-1">Start the conversation below</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = (msg.sender?._id || msg.sender) === myId;
          
          return (
            <div
              key={i}
              className={`flex ${isMine ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[75%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-lg ${
                  isMine
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-md"
                    : "bg-white/10 backdrop-blur-sm text-white border border-white/10 rounded-bl-md"
                }`}
              >
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      {/* 🔹 Typing Indicator + Input Area */}
      <div className="backdrop-blur-xl bg-white/5 border-t border-white/10">
        {/* Typing indicator */}
        {typingUser && (
          <div className="px-5 py-2 text-slate-400 text-sm flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
            <span>{typingUser} is typing...</span>
          </div>
        )}

        {/* Input area */}
        <div className="p-4 flex gap-3">
          <div className="flex-1 relative">
            <input
              value={newMsg}
              onChange={(e) => {
                setNewMsg(e.target.value);
                socket.emit("showTyping", chatId);

                clearTimeout(typingTimeout.current);
                typingTimeout.current = setTimeout(() => {
                  socket.emit("hideTyping", chatId);
                }, 1500);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all placeholder:text-slate-500 text-white"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMsg.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 disabled:shadow-none flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </div>
      </div>

      {/* 🔹 Profile Modal - Premium */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="relative animate-in zoom-in-95 duration-300">
            <div className="relative overflow-hidden rounded-3xl border-4 border-white/20 shadow-2xl">
              <img
                src={chatUser?.profilePhoto || "https://i.pravatar.cc/300"}
                className="w-80 h-80 sm:w-96 sm:h-96 object-cover"
                alt={chatUser?.username}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                <p className="text-white text-2xl font-bold">{chatUser?.username}</p>
                <p className="text-slate-300 text-sm flex items-center gap-2 mt-1">
                  {isOnline ? (
                    <>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                      Online
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                      Offline
                    </>
                  )}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowProfile(false)}
              className="absolute -top-4 -right-4 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center font-bold text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}