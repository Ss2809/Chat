require("dotenv").config();
const express = require("express");
const user = require("./routes/user");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);

const db = require("./db");
const chat = require("./routes/chat");
const jwt = require("jsonwebtoken");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const cors = require("cors");
app.use(cors());

db();
app.use(express.json());

app.use("/api/user", user);
app.use("/api/chat", chat);

/* 🔐 Socket Auth Middleware */
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
const Message = require("./model/message");
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.user.username);
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
    content: data.text
  });

  io.to(data.chatId).emit("receiveMessage", msg);
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
