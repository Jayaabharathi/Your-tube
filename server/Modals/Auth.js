import mongoose from "mongoose";

const userschema = mongoose.Schema(
  {
    username: String,

    email: {
      type: String,
      required: true,
    },

    name: String,
    channelname: String,
    description: String,
    image: String,
    password: String,

    isPremium: {
      type: Boolean,
      default: false,
    },
    planType: {
      type: String,
      enum: ["Free", "Bronze", "Silver", "Gold"],
      default: "Free",
    },

    mobileNumber: String,
    otp: String,
    otpExpiresAt: Date,

    downloadsToday: {
      type: Number,
      default: 0,
    },

    lastDownloadDate: {
      type: Date,
      default: null,
    },

    joinedon: {
      type: Date,
      default: Date.now,
    },
    downloads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    subscriptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("user", userschema);
