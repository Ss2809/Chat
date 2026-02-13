import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import StartChat from "./StartChat";
import { io } from "socket.io-client";
import avatarPlaceholder from "../assets/avatar-white.svg";
import { useTheme } from "../context/ThemeContext";

export default function ChatLayout() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const menuRef = useRef(null);

  // Chat List States
  const [chats, setChats] = useState([]);
  const [myId, setMyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Chat Screen States
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [socket, setSocket] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [selectedChatId, setSelectedChatId] = useState(chatId || null);

  const token = localStorage.getItem("token");

  const fetchMe = useCallback(async () => {
    try {
      const res = await axios.get("https://chat-vxd8.onrender.com/api/user/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMe(res.data);
    } catch (err) {
      console.log("Me fetch error", err);
    }
  }, [token]);

  const fetchChats = useCallback(async () => {
    try {
      const res = await axios.get("https://chat-vxd8.onrender.com/api/chat/chatlist", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.userchat) {
        setChats(res.data.userchat);
      } else {
        setChats([]);
      }
    } catch (err) {
      console.log("Chat list error:", err);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.get(`https://chat-vxd8.onrender.com/api/chat/${selectedChatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.log("Messages fetch error:", err);
    }
  }, [selectedChatId, token]);

  const fetchChatUser = useCallback(async () => {
    try {
      const res = await axios.get("https://chat-vxd8.onrender.com/api/chat/chatlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chat = res.data.userchat.find((c) => c._id === selectedChatId);
      const other = chat.users.find((u) => u._id !== myId);
      setChatUser(other);
    } catch (err) {
      console.log("Chat user fetch error:", err);
    }
  }, [myId, selectedChatId, token]);

  useEffect(() => {
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setMyId(decoded._id);
    }
  }, [token]);

  // Socket connection
  useEffect(() => {
    const newSocket = io("https://chat-vxd8.onrender.com", {
      auth: { token },
    });
    setSocket(newSocket);

    newSocket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => newSocket.disconnect();
  }, [token]);

  // Join chat + socket listeners
  useEffect(() => {
    if (!socket || !selectedChatId) return;

    socket.emit("joinChat", selectedChatId);

    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("showTyping", (username) => {
      setTypingUser(username);
    });

    socket.on("hideTyping", () => {
      setTypingUser("");
    });

    socket.on("messageStatusUpdate", ({ messageId, status, deliveredAt, readAt }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId
            ? {
                ...message,
                status,
                deliveredAt: deliveredAt || message.deliveredAt,
                readAt: readAt || message.readAt,
              }
            : message
        )
      );
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("showTyping");
      socket.off("hideTyping");
      socket.off("messageStatusUpdate");
    };
  }, [socket, selectedChatId]);

  useEffect(() => {
    if (!socket || !selectedChatId || !myId || !messages.length) return;

    const incomingMessages = messages.filter((msg) => (msg.sender?._id || msg.sender) !== myId);

    const justReceivedIds = incomingMessages
      .filter((msg) => msg.status === "sent")
      .map((msg) => msg._id)
      .filter(Boolean);

    if (justReceivedIds.length > 0) {
      socket.emit("messageDelivered", { chatId: selectedChatId, messageIds: justReceivedIds });
    }

    const hasUnreadIncoming = incomingMessages.some((msg) => msg.status !== "read");
    if (hasUnreadIncoming) {
      socket.emit("messagesRead", { chatId: selectedChatId });
    }
  }, [socket, selectedChatId, myId, messages]);

  // Load data
  useEffect(() => {
    fetchChats();
    fetchMe();
  }, [fetchChats, fetchMe]);

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages();
      fetchChatUser();
    }
  }, [selectedChatId, fetchMessages, fetchChatUser]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const sendMessage = () => {
    if (!newMsg.trim() || !socket) return;

    socket.emit("sendMessage", {
      chatId: selectedChatId,
      text: newMsg,
    });

    socket.emit("hideTyping", selectedChatId);
    setNewMsg("");
  };

  const clearChat = async () => {
    if (!window.confirm("Clear all messages in this chat?")) return;
    
    try {
      await axios.delete(`https://chat-vxd8.onrender.com/api/chat/deletechat/${selectedChatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([]);
    } catch (err) {
      console.log("Clear chat error:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your account permanently?")) return;

    await axios.delete("https://chat-vxd8.onrender.com/api/user/deleteAccount", {
      headers: { Authorization: `Bearer ${token}` }
    });

    localStorage.removeItem("token");
    navigate("/");
  };

  const handleChatClick = (chatIdParam) => {
    setSelectedChatId(chatIdParam);
    if (window.innerWidth < 768) {
      navigate(`/chat/${chatIdParam}`);
    }
  };

  const isOnline = chatUser && onlineUsers.includes(chatUser._id);

  return (
    <div 
      className="flex h-screen overflow-hidden relative transition-colors duration-300"
      style={{ background: 'var(--bg-void)', color: 'var(--text-pure)' }}
    >
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#00f5ff] rounded-full filter blur-[150px] opacity-[0.03]" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#ff2d7a] rounded-full filter blur-[180px] opacity-[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#bf5fff] rounded-full filter blur-[160px] opacity-[0.02]" />
      </div>

      {/* Chat List Sidebar */}
      <div 
        className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] flex-col backdrop-blur-xl border-r transition-colors duration-300`}
        style={{ background: 'var(--bg-space)', borderColor: 'var(--glass-border)' }}
      >
        
        {/* Header */}
        <div className="relative z-50 p-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar-ring">
                <img
                  src={me?.profilePhoto || avatarPlaceholder}
                  className="w-12 h-12 rounded-full object-cover"
                  alt="Profile"
                />
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--text-pure)' }}>{me?.username || "User"}</p>
                <p className="text-xs truncate max-w-[150px]" style={{ color: 'var(--text-dim)' }}>
                  {me?.bio || "No bio set"}
                </p>
              </div>
            </div>

            <div className="relative z-[100]" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:border-[#00f5ff]/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {menuOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-52 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 transition-colors duration-300"
                  style={{ background: 'var(--bg-space)', border: '1px solid var(--glass-border)' }}
                >
                  <button 
                    onClick={() => {
                      navigate("/profile");
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3.5 hover:bg-white/5 transition-colors flex items-center gap-3 text-sm group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#00f5ff]/10 flex items-center justify-center group-hover:bg-[#00f5ff]/20 transition-colors">
                      <svg className="w-4 h-4 text-[#00f5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    Update Profile
                  </button>
                  <button 
                    onClick={() => {
                      toggleTheme();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3.5 hover:bg-white/5 transition-colors flex items-center gap-3 text-sm border-t border-white/5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#b8ff00]/10 flex items-center justify-center group-hover:bg-[#b8ff00]/20 transition-colors">
                      {isDark ? (
                        <svg className="w-4 h-4 text-[#b8ff00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-[#b8ff00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                    </div>
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button 
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3.5 hover:bg-white/5 transition-colors flex items-center gap-3 text-sm border-t border-white/5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#bf5fff]/10 flex items-center justify-center group-hover:bg-[#bf5fff]/20 transition-colors">
                      <svg className="w-4 h-4 text-[#bf5fff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    Logout
                  </button>
                  <button 
                    onClick={() => {
                      deleteAccount();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3.5 text-[#ff2d7a] hover:bg-[#ff2d7a]/10 transition-colors flex items-center gap-3 text-sm border-t border-white/5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#ff2d7a]/10 flex items-center justify-center group-hover:bg-[#ff2d7a]/20 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    Delete Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full border-2 border-[#00f5ff]/20 border-t-[#00f5ff] animate-spin mb-4" />
              <p className="text-[#6b6b80]">Loading chats...</p>
            </div>
          )}

          {!loading && chats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00f5ff]/10 to-[#ff2d7a]/10 flex items-center justify-center mb-4 border border-white/5">
                <svg className="w-10 h-10 text-[#00f5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-white font-medium mb-1">No conversations yet</p>
              <p className="text-[#6b6b80] text-sm">Start a new chat below</p>
            </div>
          )}

          {chats.map((chat) => {
            const otherUser = chat.users?.find((u) => u._id !== myId);
            const isUserOnline = onlineUsers.includes(otherUser?._id);
            const isActive = chat._id === selectedChatId;

            return (
              <div
                key={chat._id}
                onClick={() => handleChatClick(chat._id)}
                className={`group relative flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#00f5ff]/10 to-[#ff2d7a]/10 border border-[#00f5ff]/30' 
                    : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`p-[2px] rounded-full ${isActive ? 'bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a]' : 'bg-transparent'}`}>
                    <img
                      src={otherUser?.profilePhoto || avatarPlaceholder}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#0c0c14]"
                      alt={otherUser?.username}
                    />
                  </div>
                  {isUserOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#b8ff00] rounded-full border-2 border-[#0c0c14] shadow-lg shadow-[#b8ff00]/50" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-white truncate">
                      {otherUser?.username || "Unknown"}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isUserOnline 
                        ? 'bg-[#b8ff00]/10 text-[#b8ff00]' 
                        : 'bg-white/5 text-[#6b6b80]'
                    }`}>
                      {isUserOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b6b80] truncate">
                    {otherUser?.bio || "No bio available"}
                  </p>
                </div>

                <svg className={`w-5 h-5 flex-shrink-0 transition-all ${isActive ? 'text-[#00f5ff]' : 'text-[#6b6b80] group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            );
          })}
        </div>

        {/* Start new chat */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <StartChat refreshChats={fetchChats} />
        </div>
      </div>

      {/* Chat Screen - Right Side */}
      {selectedChatId ? (
        <div className="flex-1 flex flex-col transition-colors duration-300" style={{ background: 'var(--bg-void)' }}>
          {/* Chat Header */}
          <div className="relative p-4 border-b backdrop-blur-xl transition-colors duration-300" style={{ background: 'var(--bg-space)', borderColor: 'var(--glass-border)' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-[#00f5ff]/5 via-transparent to-[#ff2d7a]/5" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedChatId(null);
                    navigate("/chat");
                  }}
                  className="md:hidden w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div 
                  className="avatar-ring cursor-pointer"
                  onClick={() => setShowProfile(true)}
                >
                  <img
                    src={chatUser?.profilePhoto || avatarPlaceholder}
                    className="w-11 h-11 rounded-full object-cover"
                    alt={chatUser?.username}
                  />
                </div>

                <div>
                  <p className="text-white font-bold">
                    {chatUser?.username || "Loading..."}
                  </p>
                  <p className="text-xs flex items-center gap-1.5">
                    {isOnline ? (
                      <>
                        <span className="w-2 h-2 bg-[#b8ff00] rounded-full animate-pulse shadow-lg shadow-[#b8ff00]/50" />
                        <span className="text-[#b8ff00]">Online</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-[#6b6b80] rounded-full" />
                        <span className="text-[#6b6b80]">Offline</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={clearChat}
                className="px-4 py-2 rounded-xl bg-[#ff2d7a]/10 hover:bg-[#ff2d7a]/20 border border-[#ff2d7a]/20 text-[#ff2d7a] text-sm font-medium transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00f5ff]/10 to-[#ff2d7a]/10 flex items-center justify-center mb-4 border border-white/5">
                  <svg className="w-12 h-12 text-[#00f5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-1">No messages yet</p>
                <p className="text-[#6b6b80] text-sm">Send a message to start the conversation</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isMine = (msg.sender?._id || msg.sender) === myId;
              const messageStatus = msg.status === "read" ? "Seen" : msg.status === "delivered" ? "Delivered" : "Sent";
              
              return (
                <div
                  key={i}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[75%] sm:max-w-[65%] px-4 py-3 ${
                      isMine
                        ? "chat-bubble-mine text-white"
                        : "chat-bubble-other"
                    }`}
                    style={!isMine ? { color: 'var(--text-pure)' } : {}}
                  >
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                    {isMine && (
                      <p className="mt-1 text-[11px] opacity-80 text-right">{messageStatus}</p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Typing + Input */}
          <div className="border-t backdrop-blur-xl transition-colors duration-300" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-space)' }}>
            {typingUser && (
              <div className="px-5 py-2 text-[#6b6b80] text-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#00f5ff] rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-[#bf5fff] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-[#ff2d7a] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>{typingUser} is typing...</span>
              </div>
            )}

            <div className="p-4 flex gap-3">
              <div className="flex-1 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a] rounded-2xl opacity-0 group-focus-within:opacity-30 blur-xl transition-opacity duration-500" />
                <input
                  value={newMsg}
                  onChange={(e) => {
                    setNewMsg(e.target.value);
                    socket?.emit("showTyping", selectedChatId);

                    clearTimeout(typingTimeout.current);
                    typingTimeout.current = setTimeout(() => {
                      socket?.emit("hideTyping", selectedChatId);
                    }, 1500);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="relative w-full px-4 py-3.5 rounded-2xl focus:outline-none focus:border-[#00f5ff]/50 transition-all"
                  style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-pure)' }}
                />
              </div>

              <button
                onClick={sendMessage}
                disabled={!newMsg.trim()}
                className="px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#6b6b80]/30 disabled:cursor-not-allowed rounded-2xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 flex items-center gap-2 text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State - Desktop Only */
        <div className="hidden md:flex flex-1 items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#00f5ff] rounded-full filter blur-[150px] opacity-[0.05] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#ff2d7a] rounded-full filter blur-[150px] opacity-[0.05] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative text-center px-8 max-w-md">
            <div className="w-28 h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#00f5ff]/10 to-[#ff2d7a]/10 flex items-center justify-center border border-white/5">
              <svg className="w-14 h-14 text-[#00f5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-3 text-gradient">
              Select a Chat
            </h2>
            <p className="text-[#6b6b80] leading-relaxed">
              Choose a conversation from the sidebar or start a new one
            </p>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="relative animate-in zoom-in-95 duration-300">
            <div className="relative overflow-hidden rounded-3xl p-[2px] bg-gradient-to-br from-[#00f5ff] to-[#ff2d7a]">
              <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-space)' }}>
                <img
                  src={chatUser?.profilePhoto || avatarPlaceholder}
                  className="w-80 h-80 sm:w-96 sm:h-96 object-cover"
                  alt={chatUser?.username}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6" style={{ background: 'linear-gradient(to top, var(--bg-space), var(--bg-space)/80, transparent)' }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-pure)' }}>{chatUser?.username}</p>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-dim)' }}>{chatUser?.bio || "No bio"}</p>
                  <p className="text-sm flex items-center gap-2">
                    {isOnline ? (
                      <>
                        <span className="w-2 h-2 bg-[#b8ff00] rounded-full animate-pulse shadow-lg shadow-[#b8ff00]/50" />
                        <span className="text-[#b8ff00]">Online</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-[#6b6b80] rounded-full" />
                        <span className="text-[#6b6b80]">Offline</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowProfile(false)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-[#ff2d7a] hover:bg-[#ff2d7a]/80 text-white rounded-full shadow-lg shadow-[#ff2d7a]/30 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center font-bold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
