const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String },
  seenBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  // Delivery metrics
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },
  deliveredAt: { type: Date },
  readAt: { type: Date },
  deliveredTo: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deliveredAt: { type: Date }
    }
  ],
  readBy: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date }
    }
  ]
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;