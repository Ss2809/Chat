require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const user = require("./routes/user");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const db = require("./db");
const chat = require("./routes/chat");
const jwt = require("jsonwebtoken");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(helmet());
app.use(cors());

db();
app.use(express.json());

app.use("/api/user", user);
app.use("/api/chat", chat);
const Message = require("./model/message");
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.accessToken);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  // console.log("User connected:", socket.user.username);
  onlineUsers.set(socket.user._id.toString(), socket.id);
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log("User joined room:", chatId);
  });

  socket.on("sendMessage", async (data) => {
    const msg = await Message.create({
      chatId: data.chatId,
      sender: socket.user._id,
      content: data.text,
      status: "sent"
    });

    const populatedMsg = await Message.findById(msg._id).populate("sender", "username profilePhoto");
    io.to(data.chatId).emit("receiveMessage", populatedMsg);
  });

  // Mark messages as delivered when received
  socket.on("messageDelivered", async (data) => {
    const { messageIds, chatId } = data;
    const userId = socket.user._id;
    const now = new Date();

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        sender: { $ne: userId },
        status: "sent"
      },
      {
        $set: { status: "delivered", deliveredAt: now },
        $addToSet: {
          deliveredTo: { user: userId, deliveredAt: now }
        }
      }
    );

    // Notify sender about delivery
    const messages = await Message.find({ _id: { $in: messageIds } });
    messages.forEach((msg) => {
      const senderSocketId = onlineUsers.get(msg.sender.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageStatusUpdate", {
          messageId: msg._id,
          status: "delivered",
          deliveredAt: now
        });
      }
    });
  });

  // Mark messages as read
  socket.on("messagesRead", async (data) => {
    const { chatId } = data;
    const userId = socket.user._id;
    const now = new Date();

    const updatedMessages = await Message.find({
      chatId: chatId,
      sender: { $ne: userId },
      status: { $ne: "read" }
    });

    await Message.updateMany(
      {
        chatId: chatId,
        sender: { $ne: userId },
        status: { $ne: "read" }
      },
      {
        $set: { status: "read", readAt: now },
        $addToSet: {
          seenBy: userId,
          readBy: { user: userId, readAt: now }
        }
      }
    );

    // Notify senders about read receipts
    updatedMessages.forEach((msg) => {
      const senderSocketId = onlineUsers.get(msg.sender.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageStatusUpdate", {
          messageId: msg._id,
          status: "read",
          readAt: now
        });
      }
    });

    // Also broadcast to the chat room
    socket.to(chatId).emit("messagesReadUpdate", {
      chatId,
      readBy: userId,
      readAt: now
    });
  });

  socket.on("showTyping", (chatId) => {
    socket.to(chatId).emit("showTyping", socket.user.username);
  });

  socket.on("hideTyping", (chatId) => {
    socket.to(chatId).emit("hideTyping");
  });
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.user._id.toString());

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server Running on ${PORT}....`));
