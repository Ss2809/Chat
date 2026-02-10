import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import StartChat from "./StartChat";
import { io } from "socket.io-client";

export default function ChatLayout() {
  const { chatId } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setMyId(decoded._id);
    }
  }, [token]);

  // Socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:8000", {
      auth: { token },
    });
    setSocket(newSocket);

    newSocket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => newSocket.disconnect();
  }, []);

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

    return () => {
      socket.off("receiveMessage");
      socket.off("showTyping");
      socket.off("hideTyping");
    };
  }, [socket, selectedChatId]);

  // Load data
  useEffect(() => {
    fetchChats();
    fetchMe();
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages();
      fetchChatUser();
    }
  }, [selectedChatId]);

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

  const fetchMe = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/user/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMe(res.data);
    } catch (err) {
      console.log("Me fetch error", err);
    }
  };

  const fetchChats = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/chat/chatlist", {
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
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/chat/${selectedChatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.log("Messages fetch error:", err);
    }
  };

  const fetchChatUser = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/chat/chatlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chat = res.data.userchat.find((c) => c._id === selectedChatId);
      const other = chat.users.find((u) => u._id !== myId);
      setChatUser(other);
    } catch (err) {
      console.log("Chat user fetch error:", err);
    }
  };

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
      await axios.delete(`http://localhost:8000/api/chat/deletechat/${selectedChatId}`, {
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

    await axios.delete("http://localhost:8000/api/user/deleteAccount", {
      headers: { Authorization: `Bearer ${token}` }
    });

    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleChatClick = (chatIdParam) => {
    setSelectedChatId(chatIdParam);
    // On mobile, navigate to chat page
    if (window.innerWidth < 768) {
      navigate(`/chat/${chatIdParam}`);
    }
  };

  const isOnline = chatUser && onlineUsers.includes(chatUser._id);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-hidden relative">
      
      {/* Chat List Sidebar */}
      <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col backdrop-blur-xl bg-white/5 border-r border-white/10`}>
        
        {/* Header */}
        <div className="relative overflow-visible z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"></div>
          <div className="relative p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={me?.profilePhoto || "https://i.pravatar.cc/150"}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20"
                    alt="Profile"
                  />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900"></div>
                </div>
                <div>
                  <p className="font-semibold text-white">{me?.username || "User"}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>

              <div className="relative z-[100]" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 backdrop-blur-xl bg-slate-900/95 rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => {
                        navigate("/profile");
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Update Profile
                    </button>
                    <button 
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-sm border-t border-white/5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                    <button 
                      onClick={() => {
                        deleteAccount();
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 text-sm border-t border-white/5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400">Loading chats...</p>
            </div>
          )}

          {!loading && chats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">No chats yet</p>
              <p className="text-slate-500 text-xs mt-1">Start a new conversation below</p>
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
                className={`group relative flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all duration-200 border ${
                  isActive 
                    ? 'bg-white/10 border-purple-500/50' 
                    : 'border-transparent hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={otherUser?.profilePhoto || "https://api.dicebear.com/7.x/avataaars/svg"}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-purple-500/30 transition-all"
                    alt={otherUser?.username}
                  />
                  {isUserOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-white truncate">
                      {otherUser?.username || "Unknown"}
                    </p>
                    {isUserOnline ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 ml-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        Online
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 ml-2">Offline</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {otherUser?.bio || "No bio available"}
                  </p>
                </div>

                <svg className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            );
          })}
        </div>

        {/* Start new chat */}
        <div className="p-4 border-t border-white/10">
          <StartChat refreshChats={fetchChats} />
        </div>
      </div>

      {/* Chat Screen - Right Side */}
      {selectedChatId ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="relative overflow-hidden backdrop-blur-xl bg-white/5 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>
            
            <div className="relative flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedChatId(null);
                    navigate("/chat");
                  }}
                  className="md:hidden w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-200 hover:scale-105"
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

              <button
                onClick={clearChat}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            </div>
          </div>

          {/* Messages */}
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

          {/* Typing + Input */}
          <div className="backdrop-blur-xl bg-white/5 border-t border-white/10">
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

            <div className="p-4 flex gap-3">
              <div className="flex-1 relative">
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
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State - Desktop Only */
        <div className="hidden md:flex flex-1 items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative text-center px-8 max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10">
              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Start a Conversation
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Select a chat from the sidebar to begin messaging
            </p>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="relative animate-in zoom-in-95 duration-300">
            <div className="relative overflow-hidden rounded-3xl border-4 border-white/20 shadow-2xl">
              <img
                src={chatUser?.profilePhoto || "https://i.pravatar.cc/300"}
                className="w-80 h-80 sm:w-96 sm:h-96 object-cover"
                alt={chatUser?.username}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                <p className="text-white text-2xl font-bold">{chatUser?.username}</p>
                <p className="text-slate-300 text-sm mt-1">{chatUser?.bio || "No bio"}</p>
                <p className="text-slate-300 text-sm flex items-center gap-2 mt-2">
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
