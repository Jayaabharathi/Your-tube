import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import nodemailer from "nodemailer";

export const login = async (req, res) => {
  const { email, name, image } = req.body;

  try {
    const existingUser = await users.findOne({ email }).populate("subscriptions");

    if (!existingUser) {
      const newUser = await users.create({ email, name, image });
      return res.status(201).json({ result: newUser });
    } else {
      return res.status(200).json({ result: existingUser });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description, image } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
          image: image,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


export const upgradeToPremium = async (req, res) => {
  try {
    const { userid } = req.body;

    const user = await users.findById(userid);
    if (!user) return res.status(404).json("User not found");

    user.isPremium = true;
    user.downloadsToday = 0;
    user.lastDownloadDate = null;

    await user.save();

    res.status(200).json({ message: "Premium activated" });
  } catch (err) {
    res.status(500).json("Server error");
  }
};

export const sendOTP = async (req, res) => {
  const { email, mobileNumber, region } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  try {
    let user;
    if (email) {
      user = await users.findOne({ email });
      if (!user) {
        user = await users.create({ 
          email, 
          name: email.split("@")[0], 
          image: "https://github.com/shadcn.png" 
        });
      }
    } else if (mobileNumber) {
      user = await users.findOne({ mobileNumber });
      if (!user) {
        user = await users.create({ 
          mobileNumber, 
          email: `${mobileNumber}@mobile.user`, 
          name: `User_${mobileNumber}`, 
          image: "https://github.com/shadcn.png" 
        });
      }
    }

    if (!user) return res.status(400).json({ message: "Invalid request data" });

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    const isSouthIndia = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"].includes(region);

    if (isSouthIndia && email) {
      // 📧 Send Email OTP safely to South India users
      let transporter;
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          tls: { rejectUnauthorized: false }
        });
      } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email", port: 587, secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
          tls: { rejectUnauthorized: false }
        });
      }
      
      const info = await transporter.sendMail({
        from: `"YourTube Auth" <${process.env.EMAIL_USER || "auth@yourtube.com"}>`,
        to: email,
        subject: "YourTube Login OTP",
        text: `Your highly secure one-time login OTP is: ${otp}. It expires in exactly 5 minutes.`
      });
      
      if (!process.env.EMAIL_USER) {
        console.log("OTP Mock Email Preview URL: " + nodemailer.getTestMessageUrl(info));
      }
      
      return res.status(200).json({ message: "OTP securely dispatched to email" });
    } else if (!isSouthIndia && mobileNumber) {
      // 📱 Mock SMS safely to all auxiliary regions
      console.log(`\n\n=== 📱 [MOCK SMS] ===\nTo: ${mobileNumber}\nMessage: Your highly secure login OTP is ${otp}\n=====================\n\n`);
      return res.status(200).json({ message: "OTP transmitted to mobile connection" });
    } else {
       return res.status(400).json({ message: "Provided communication method does not authorize with designated physical location mappings." });
    }
  } catch (error) {
    console.error("sendOTP Error:", error);
    res.status(500).json({ message: "Internal server error occurred while sending OTP", detail: error.stack || error.message || error.toString() });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, mobileNumber, otp } = req.body;
  try {
    let user;
    if (email) user = await users.findOne({ email, otp });
    else if (mobileNumber) user = await users.findOne({ mobileNumber, otp });

    if (!user) return res.status(400).json({ message: "Provided OTP is either invalid, or the user does not exist" });

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "The OTP submitted timeline has expired. Request a new iteration." });
    }

    // 🔒 Nuke local OTP storage to bypass replay manipulations 
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.status(200).json({ result: user });
  } catch (error) {
    console.error("verifyOTP Error:", error);
    return res.status(500).json({ message: "Internal server error occurred while matching iteration signatures." });
  }
};

export const subscribeChannel = async (req, res) => {
  const { id: channelId } = req.params;
  const { userId } = req.body;

  try {
    // 1. Validate and Find User (the one who is subscribing)
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid User ID" });
    }
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Find Target Channel (can be ID or Name)
    let targetChannelId = channelId;
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        // Fallback: Find channel by name if ID is invalid (case-insensitive)
        const target = await users.findOne({ 
            $or: [
                { name: { $regex: new RegExp(`^${channelId}$`, "i") } }, 
                { channelname: { $regex: new RegExp(`^${channelId}$`, "i") } }
            ] 
        });
        if (!target) return res.status(404).json({ message: `Channel not found by ID or Name: ${channelId}` });
        targetChannelId = target._id.toString();
    }

    // Ensure subscriptions array exists
    if (!user.subscriptions) user.subscriptions = [];

    const isSubscribed = user.subscriptions.some(id => id.toString() === targetChannelId);

    if (isSubscribed) {
      user.subscriptions = user.subscriptions.filter((id) => id.toString() !== targetChannelId);
    } else {
      user.subscriptions.push(targetChannelId);
    }

    await user.save();
    console.log(`User ${userId} ${isSubscribed ? "unsubscribed from" : "subscribed to"} ${targetChannelId}`);
    res.status(200).json({ 
      message: isSubscribed ? "Unsubscribed successfully" : "Subscribed successfully", 
      subscriptions: user.subscriptions 
    });
  } catch (error) {
    console.error("Subscription Error (Detailed):", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};
