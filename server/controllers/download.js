import Download from "../Modals/download.js";
import User from "../Modals/Auth.js";
import Video from "../Modals/video.js";
export const getUserDownloads = async (req, res) => {
  try {
    const downloads = await Download.find({ userId: req.params.userid })
      .populate("videoId")
      .sort({ createdAt: -1 });

    res.status(200).json(downloads);
  } catch (err) {
    res.status(500).json(err.message);
  }
};
export const downloadVideo = async (req, res) => {
  try {
    const { userid, videoid } = req.body;

    const user = await User.findById(userid);
    if (!user) return res.status(404).json("User not found");

    const video = await Video.findById(videoid);
    if (!video) return res.status(404).json("Video not found");

    const today = new Date().toDateString();

    // ⭐ PREMIUM USER → unlimited downloads
    if (user.isPremium) {
      await Download.create({
        userId: userid,
        videoId: videoid,
      });

      return res.status(200).json({
        videourl: `${process.env.RENDER_EXTERNAL_URL || "http://localhost:5000"}/${video.filepath.replace(/\\/g, "/")}`,
        message: "Premium download allowed",
      });
    }

    // ⭐ FREE USER LIMIT CHECK
    if (
      user.lastDownloadDate &&
      new Date(user.lastDownloadDate).toDateString() === today &&
      user.downloadsToday >= 1
    ) {
      return res
        .status(403)
        .json("Free users can download only 1 video per day");
    }

    // ⭐ SAVE DOWNLOAD RECORD
    await Download.create({
      userId: userid,
      videoId: videoid,
    });

    // ⭐ UPDATE DOWNLOAD COUNT
    if (
      !user.lastDownloadDate ||
      new Date(user.lastDownloadDate).toDateString() !== today
    ) {
      user.downloadsToday = 1;
      user.lastDownloadDate = new Date();
    } else {
      user.downloadsToday += 1;
    }

    await user.save();

    res.status(200).json({
      videourl: `${process.env.RENDER_EXTERNAL_URL || "http://localhost:5000"}/${video.filepath.replace(/\\/g, "/")}`,
      message: "Download allowed",
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};

