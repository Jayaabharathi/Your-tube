import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

console.log("ENV CHECK:", process.env.RAZORPAY_KEY_ID);

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";

import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentRoutes from "./routes/comment.js";
import downloadRoutes from "./routes/download.js";
import paymentRoutes from "./routes/payment.js";



/* ES MODULE FIX */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });


const app = express(); // ✅ app MUST come before app.use

/* MIDDLEWARES */
app.use(cors());
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(bodyParser.json());

/* STATIC UPLOADS — allow cross-origin reads so canvas thumbnail extraction works */
app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "uploads")));

/* TEST ROUTE */
app.get("/", (req, res) => {
  res.send("YouTube backend is working ✅");
});

/* ROUTES */
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentRoutes);
app.use("/download", downloadRoutes);

app.use("/api/payment", paymentRoutes);

/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("Global Error Handler Catch:", err.message);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ message: err.message || "Something went wrong" });
});


const PORT = process.env.PORT || 5000;
const DBURL = process.env.MONGO_URI;


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 📞 VoIP SIGNALING LOGIC
io.on("connection", (socket) => {
  console.log("☎️ User connected for VoIP:", socket.id);

  socket.on("join-call-room", (roomId) => {
    console.log(`User ${socket.id} joined room: ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("leave-call-room", (roomId) => {
    console.log(`User ${socket.id} left room: ${roomId}`);
    socket.to(roomId).emit("user-left", socket.id);
    socket.leave(roomId);
  });

  socket.on("signal", ({ to, from, signal }) => {
    console.log(`Relaying ${signal.type || "candidate"} from ${from} to ${to}`);
    io.to(to).emit("signal", { from, signal });
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected from VoIP");
  });
});

/* CONNECT DB */
mongoose
  .connect(DBURL)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () => {
      console.log(`🚀 Server & VoIP running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
  });
