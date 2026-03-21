import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../Modals/Auth.js";
import nodemailer from "nodemailer";

// 1️⃣ CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount ? amount * 100 : 19900, // ₹ amount in paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json(order);
  } catch (error) {
    console.log("CREATE ORDER ERROR:", error);
    res.status(500).json({ message: "Order creation failed" });
  }
};

// 2️⃣ VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planType,
      amount,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid Signature" });
    }

    const user = await User.findById(userId);
    user.isPremium = true;
    if (planType && ["Bronze", "Silver", "Gold"].includes(planType)) {
      user.planType = planType;
    }
    await user.save();

    // 📧 SEND EMAIL NOTIFICATION IN BACKGROUND (Fire & Forget)
    // This prevents the user from waiting 60s for Render's firewall to block the email
    (async () => {
      try {
        let transporter;

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            tls: { rejectUnauthorized: false },
          });
        } else {
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email", port: 587, secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
            tls: { rejectUnauthorized: false },
          });
        }

        const info = await transporter.sendMail({
          from: `"YourTube Premium" <${process.env.EMAIL_USER || "billing@yourtube.com"}>`,
          to: user.email, 
          subject: "Your Subscription Invoice", 
          text: `Hello ${user.name},\n\nYour payment of ₹${amount || 199} was successful!\nYou are now upgraded to the ${planType || "Premium"} plan.\n\nThank you for choosing YourTube!`, 
        });

      } catch (emailErr) {
        console.error("Invoice Email sending blocked by Host firewall:", emailErr.message);
      }
    })();

    return res.status(200).json({
      message: `Payment verified. ${planType || "Premium"} activated!`,
    });
  } catch (error) {
    console.log("VERIFY ERROR:", error);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

