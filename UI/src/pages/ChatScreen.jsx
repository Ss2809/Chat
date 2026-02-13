import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import avatarPlaceholder from "../assets/avatar-white.svg";

// Message Status Icon Component - Premium minimal style
const MessageStatus = ({ status, isMine }) => {
  if (!isMine) return null;
  
  if (status === "read") {
    // Double check - subtle white/silver for read
    return (
      <div className="flex items-center gap-0.5 opacity-80">
        <svg className="w-3.5 h-3.5 text-white/90" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 2.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z"/>
        </svg>
        <svg className="w-3.5 h-3.5 -ml-2 text-white/90" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 2.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z"/>
        </svg>
      </div>
    );
  }
  
  if (status === "delivered") {
    // Double check - muted for delivered
    return (
      <div className="flex items-center gap-0.5 opacity-50">
        <svg className="w-3.5 h-3.5 text-white/70" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 2.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z"/>
        </svg>
        <svg className="w-3.5 h-3.5 -ml-2 text-white/70" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 2.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z"/>
        </svg>
      </div>
    );
  }
  
  // Single check - very subtle for sent
  return (
    <div className="opacity-40">
      <svg className="w-3.5 h-3.5 text-white/60" viewBox="0 0 16 16" fill="currentColor">
        <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 2.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z"/>
      </svg>
    </div>
  );
};

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

  /* Connect socket */
  useEffect(() => {
    const newSocket = io("https://chat-vxd8.onrender.com", {
      auth: { token },
    });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [token]);

  /* Join chat + socket listeners */
  useEffect(() => {
    if (!socket) return;

    socket.emit("joinChat", chatId);
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });
    socket.off("onlineUsers");

    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
      
      // Mark message as delivered if it's from another user
      const senderId = data.sender?._id || data.sender;
      if (senderId !== myId) {
        socket.emit("messageDelivered", {
          messageIds: [data._id],
          chatId
        });
      }
    });
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // Listen for message status updates
    socket.on("messageStatusUpdate", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, status: data.status, deliveredAt: data.deliveredAt, readAt: data.readAt }
            : msg
        )
      );
    });

    // Listen for batch read updates
    socket.on("messagesReadUpdate", (data) => {
      if (data.chatId === chatId) {
        setMessages((prev) =>
          prev.map((msg) => {
            const senderId = msg.sender?._id || msg.sender;
            if (senderId === myId && msg.status !== "read") {
              return { ...msg, status: "read", readAt: data.readAt };
            }
            return msg;
          })
        );
      }
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
      socket.off("messageStatusUpdate");
      socket.off("messagesReadUpdate");
    };
  }, [socket, chatId, myId]);

  /* Load messages + user */
  useEffect(() => {
    fetchMessages();
    fetchChatUser();
  }, [fetchMessages, fetchChatUser]);

  /* Mark messages as read when chat is opened */
  useEffect(() => {
    if (socket && chatId && messages.length > 0) {
      const unreadMessages = messages.filter(msg => {
        const senderId = msg.sender?._id || msg.sender;
        return senderId !== myId && msg.status !== "read";
      });
      
      if (unreadMessages.length > 0) {
        socket.emit("messagesRead", { chatId });
      }
    }
  }, [socket, chatId, messages, myId]);

  /* Auto scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Send message */
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
    <div className="h-[100dvh] w-screen flex flex-col bg-[#050508] overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00f5ff] rounded-full filter blur-[150px] opacity-[0.03]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#ff2d7a] rounded-full filter blur-[180px] opacity-[0.03]" />
      </div>
      
      {/* Top bar - Header */}
      <div className="relative border-b border-white/5 bg-[#0c0c14]/80 backdrop-blur-xl shrink-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00f5ff]/5 via-transparent to-[#ff2d7a]/5" />
        
        <div className="relative flex items-center justify-between p-4">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/chat")}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:border-[#00f5ff]/50"
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

          {/* Right side - Clear Chat */}
          <button
            onClick={clearChat}
            className="px-4 py-2 rounded-xl bg-[#ff2d7a]/10 hover:bg-[#ff2d7a]/20 border border-[#ff2d7a]/20 text-[#ff2d7a] text-sm font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00f5ff]/10 to-[#ff2d7a]/10 flex items-center justify-center mb-4 border border-white/5">
              <svg className="w-12 h-12 text-[#00f5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">No messages yet</p>
            <p className="text-[#6b6b80] text-sm">Start the conversation below</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = (msg.sender?._id || msg.sender) === myId;
          const messageTime = new Date(msg.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          return (
            <div
              key={msg._id || i}
              className={`flex ${isMine ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[75%] sm:max-w-[60%] px-4 py-2.5 ${
                  isMine
                    ? "chat-bubble-mine text-white shadow-lg shadow-[#ff2d7a]/20"
                    : "chat-bubble-other text-white"
                }`}
              >
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                <div className={`flex items-center gap-1.5 mt-1.5 ${isMine ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px] text-white/40 font-light tracking-wide">{messageTime}</span>
                  <MessageStatus status={msg.status || "sent"} isMine={isMine} />
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      {/* Typing Indicator + Input Area */}
      <div className="border-t border-white/5 bg-[#0c0c14]/80 backdrop-blur-xl shrink-0">
        {/* Typing indicator */}
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

        {/* Input area */}
        <div className="p-4 flex gap-3">
          <div className="flex-1 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a] rounded-2xl opacity-0 group-focus-within:opacity-30 blur-xl transition-opacity duration-500" />
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
              className="relative w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-[#00f5ff]/50 transition-all placeholder:text-[#6b6b80] text-white"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMsg.trim()}
            className="px-6 py-3 bg-gradient-to-r from-[#00f5ff] to-[#ff2d7a] hover:from-[#00f5ff]/90 hover:to-[#ff2d7a]/90 disabled:from-[#6b6b80]/20 disabled:to-[#6b6b80]/20 disabled:cursor-not-allowed rounded-2xl font-bold shadow-lg shadow-[#00f5ff]/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 disabled:shadow-none flex items-center gap-2 text-[#050508]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="relative animate-in zoom-in-95 duration-300">
            <div className="relative overflow-hidden rounded-3xl p-[2px] bg-gradient-to-br from-[#00f5ff] to-[#ff2d7a]">
              <div className="bg-[#0c0c14] rounded-3xl overflow-hidden">
                <img
                  src={chatUser?.profilePhoto || avatarPlaceholder}
                  className="w-80 h-80 sm:w-96 sm:h-96 object-cover"
                  alt={chatUser?.username}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0c0c14] via-[#0c0c14]/80 to-transparent p-6">
                  <p className="text-white text-2xl font-bold mb-1">{chatUser?.username}</p>
                  <p className="text-[#6b6b80] text-sm mb-2">{chatUser?.bio || "No bio"}</p>
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
