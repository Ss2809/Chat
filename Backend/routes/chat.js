const express = require("express");
const User = require("../model/user");
const Chat = require("../model/chat");
const routes = express.Router();
const auth = require("../middleware/auth");
const Message = require("../model/message");

routes.post("/chatcreate", auth, async (req, res) => {
  const { Other_id } = req.body;
  if(!Other_id){
    return res.json({messag :"other id not found!"})
  }
  const userId = req.user._id;
  const user = await User.findById(userId);
  const otheruser = await User.findById(Other_id);
  if (!user || !otheruser) {
    return res.json({ messag: "user not found" });
  }
  let chat = await Chat.findOne({
     users: { $all: [userId, Other_id] },
  });

  if (chat) {
    return res.json({message :"Your Chat is Preset Use This !!", chat});
  }
  const newchat = new Chat({
    users: [userId, Other_id],
  });
  await newchat.save();
  res.json({ message: "Chat Create Succfully!!" });
});



routes.get("/chatlist", auth, async(req,res)=>{
  const userId = req.user._id;
  const user = await User.findById(userId);
  if(!user){
    return res.json({message : "User not Found!!"})
  }
  const userchat = await Chat.find({
    users:{$in :[userId]}
  }).populate("users", "username email  profilePhoto").sort({updatedAt : -1});
  res.json({
  userchat,
  loggedInUserId: userId
});

})

routes.get("/:chatId", auth, async (req, res) => {
  const { chatId } = req.params;

  const messages = await Message.find({ chatId: chatId })
    .populate("sender", "username profilePhoto");

  res.json(messages);
});



routes.put("/seen", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.body;

    if (!chatId) {
      return res.json({ message: "ChatId required" });
    }

    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId }, // messages sent by other user
        seen: false
      },
      {
        $set: { seen: true }
      }
    );

    res.json({ message: "Messages marked as seen" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

routes.delete("/deletechat/:chatId", auth, async (req, res) => {
  const { chatId } = req.params;

  await Message.deleteMany({ chatId: chatId });

  res.json({ message: "Clear Chatting History!!" });
});


module.exports = routes;
