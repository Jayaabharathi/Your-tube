import express from "express";
import { login, updateprofile, upgradeToPremium, sendOTP, verifyOTP, subscribeChannel } from "../controllers/auth.js";
import upload from "../filehelper/filehelper.js";
const routes = express.Router();

routes.post("/login", login);
routes.patch("/update/:id", updateprofile);
routes.patch("/subscribe/:id", subscribeChannel);
routes.post("/upload-avatar", upload.single("file"), (req, res) => {
    res.status(200).json({ filepath: `uploads/${req.file.filename}` });
});
routes.post("/upgrade", upgradeToPremium);
routes.post("/send-otp", sendOTP);
routes.post("/verify-otp", verifyOTP);

export default routes;
