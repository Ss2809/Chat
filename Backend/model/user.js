
const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
  username : {type:String, unique :true, required : true},
  email : {type:String,  required :true},
  password : {type:String,required : true},
  profilePhoto : {type:String},
  bio : {type:String},
  profileImg :{type:String},
  resetToken : {type : String},
  resetTokenExpires : {type : String}
})

const User = mongoose.model("User", userSchema);

module.exports = User;