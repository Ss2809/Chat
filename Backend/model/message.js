
const mongoose = require("mongoose")

const messageSchema = mongoose.Schema({
  chatId : {type : mongoose.Schema.Types.ObjectId,ref:"Chat"},
  sender : {type : mongoose.Schema.Types.ObjectId, ref:"User"},
  content : {type:String},
   seenBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
   
},{timestamps : true})

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;