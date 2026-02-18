const express = require("express");
const User = require("../model/user");
const routes = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const OTP = require("../model/otp");
const {sendmail,sendrestpass} = require("../config/sendEmail");
const otpTemplate = require("../config/otpTemplate");

const upload = require("../config/multer");
const cloudinary = require("../config/cloudinary");

routes.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email && existingUser.username === username) {
        return res.status(409).json({ success: false, message: "Username and Email both already exist" });
      }
      if (existingUser.email === email) {
        return res.status(409).json({ success: false, message: "Email already exists" });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ success: false, message: "Username already exists" });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const hashed = await bcrypt.hash(password, 10);

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      expiresAt,
      tempUser: { username, email, password: hashed },
    });
    const subject = "Your OTP Code for Account Verification";
    const htmltmplate = otpTemplate(otp);
    const emailSent = await sendmail(email, subject, htmltmplate);
    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

routes.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const record = await OTP.findOne({ email, otp: Number(otp) });

  if (!record) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  if (record.expiresAt < Date.now()) {
    await OTP.deleteOne({ _id: record._id });
    return res.status(400).json({ success: false, message: "OTP expired" });
  }

  const user = await User.create(record.tempUser);

  await OTP.deleteOne({ _id: record._id });

  res.json({ success: true, message: "Account verified & created" });
});

routes.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ message: "Please Add Filed!" });
    }
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.json({ message: "Invalid Username !" });
    }
    const checkpass = await bcrypt.compare(password, user.password);
    if (!checkpass) {
      return res.json({ message: "Invalid Password!" });
    }
    const accessToken = jwt.sign(
      { _id: user._id, username: username },
      process.env.accessToken,
      { expiresIn: "2h" },
    );
    const refreshToken = jwt.sign({ _id: user._id }, process.env.refreshToken, {
      expiresIn: "1d",
    });
    res.cookie(refreshToken, "refreshToken", {
      httpOnly: true,
      sameSite: "none",
      secure: false,
    });
    res.json({ message: "User Loging!", accessToken });
  } catch (error) {
    console.error(error);
    res.json({ message: "Server Error" });
  }
});

routes.post("/forget-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ message: "Email not filled!" });
  }

  const user = await User.findOne({ email: email });
  if (!user) {
    return res.json({ message: "Email not registered!" });
  }

  const testing = jwt.sign({ _id: user._id }, process.env.resetToken, {
    expiresIn: "15m",
  });

  user.resetToken = testing;
  user.resetTokenExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  const subject = "Reset Your Chat Application Password";

  const textdata = `
Password Reset Link:

https://chat-vxd8.onrender.com/reset/${testing}

This link will expire in 15 minutes.
  `;

  const emailSent = await sendrestpass(email, subject, textdata);

  if (!emailSent) {
    return res.status(500).json({ message: "Failed to send reset email" });
  }

  res.json({ message: "Reset Link sent to your Email!" });
});

routes.post("/reset/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.json({ message: "New password required" });
  }

  if (!token) {
    return res.json({ message: "Token not found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.resetToken);

    const user = await User.findById(decoded._id);
    if (!user) {
      return res.json({ message: "User not found" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    return res.json({ message: "Invalid or expired token" });
  }
});

routes.get("/logout", auth, async (req, res) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    return res.json({ message: "Already logged out" });
  }

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  return res.json({ message: "Logout successful" });
});

//update profile
routes.get("/getprofile", auth, async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId).select(
    "-password -resetToken -resetTokenExpires",
  );
  if (!user) {
    return res.json({ message: "user not found!!" });
  }
  res.json({ message: "Fetch User data", user });
});
routes.post("/profileupdate", auth, async (req, res) => {
  const userId = req.user._id;
  const data = req.body;
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true },
  ).select("-password -resetToken -resetTokenExpires");
  if (!user) {
    return res.json({ message: "user not found!!" });
  }

  res.json({ message: "profile update succfully!!", user });
});

//change password
routes.post("/changepassowrd", auth, async (req, res) => {
  const userId = req.user._id;
  const { oldpassword, newPassword } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    return res.json({ message: "user not found!!" });
  }
  const checkoldpass = await bcrypt.compare(oldpassword, user.password);
  if (!checkoldpass) {
    return res.json({ message: "Oldpassword is wrong!!" });
  }
  const hashpass = await bcrypt.hash(newPassword, 10);
  await User.findOneAndUpdate(
    { _id: user._id },
    { $set: { password: hashpass } },
  );
  res.json({ message: "password change succfully!!" });
});

//add multer and cloudinary and this setup okay
routes.post(
  "/uploadprofile",
  auth,
  upload.single("profile"),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);
      if (!user) {
        return res.json({ message: "User not found!!" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileBase64 = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${fileBase64}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: "chat_profiles",
        resource_type: "image",
      });

      user.profilePhoto = uploadResult.secure_url;
     
      await user.save();

      res.json({
        message: "Profile Image upload successfully!!",
        profilePhoto: user.profilePhoto,
      });
    } catch (error) {
      res.status(500).json({ message: "error", error });
    }
  },
);

routes.get("/me", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");
    res.json(user);
  } catch (error) {
    res.json({ message: "error", error });
  }
});

routes.get("/user/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id }).select("-password");
    res.json({ user });
  } catch (error) {
    res.json({ message: "error", error });
  }
});

routes.get("/search", auth, async (req, res) => {
  const { q } = req.query;
  if (!q) {
    res.json({ user: [] });
  }
  const user = await User.find({
    $or: [
      { username: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ],
  }).select("-password");
  res.json({ user });
});

routes.delete("/deleteAccount", auth, async (req, res) => {
  const userId = req.user._id;
  //const accessToken = take when frontend addd okey and null
  const user = await User.findByIdAndDelete(userId);
  res.json({ message: "User Account delete succfully" });
});
routes.get("/all", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const users = await User.find(
      { _id: { $ne: userId } }, // exclude self
      "username email profilePhoto bio",
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = routes;
