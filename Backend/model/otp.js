
const mongoose = require("mongoose")

const otpSchema = mongoose.Schema({
 
  email: String,
  otp: Number,
  expiresAt: Date,
  tempUser: Object 
})

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;