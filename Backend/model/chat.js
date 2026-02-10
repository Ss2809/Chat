
const mongoose = require("mongoose")

const chatSchema = mongoose.Schema({
  users: [ { type: mongoose.Schema.Types.ObjectId, ref: "User" } ],
  isGroupchat: { type: Boolean , default : false},
  groupName: { type: String },
  admin: [ { type: mongoose.Schema.Types.ObjectId, ref: "User"} ],
  latestMessage: { type: mongoose.Schema.Types.ObjectId,
    ref: "Message" },
  
},{timestamps : true})

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;