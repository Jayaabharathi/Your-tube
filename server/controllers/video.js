import video from "../Modals/video.js";

export const uploadvideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded or file type not allowed." });
  }

  try {
    const newVideo = new video({
      videotitle: req.body.videotitle,
      description: req.body.description,
      filename: req.file.originalname,
      filepath: req.file.path,
      filetype: req.file.mimetype,
      filesize: req.file.size,
      videochanel: req.body.videochanel,
      uploader: req.body.uploader,
    });

    await newVideo.save();
    res.status(201).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Upload Error Details:", JSON.stringify(error, null, 2));
    res.status(500).json({ message: error.message || "Something went wrong during upload" });
  }
};

export const getallvideo = async (req, res) => {
  try {
    const videos = await video.find();
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const singleVideo = await video.findById(req.params.id);

    if (!singleVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json(singleVideo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const downloadVideo = async (req, res) => {
  try {
    const { userId, videoId } = req.body;

    const user = await User.findById(userId);

    const today = new Date().toDateString();

    // Reset count if new day
    if (
      !user.lastDownloadDate ||
      new Date(user.lastDownloadDate).toDateString() !== today
    ) {
      user.dailyDownloadCount = 0;
      user.lastDownloadDate = new Date();
    }

    // If not premium & limit reached
    if (!user.isPremium && user.dailyDownloadCount >= 1) {
      return res.status(403).json({
        message: "Daily limit reached. Upgrade to Premium.",
      });
    }

    // Allow download
    user.dailyDownloadCount += 1;
    user.downloads.push(videoId);

    await user.save();

    res.status(200).json({ message: "Download successful" });
  } catch (error) {
    res.status(500).json("Download failed");
  }
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedVideo = await video.findByIdAndDelete(id);
    if (!deletedVideo) {
      return res.status(404).json({ message: "Video not found" });
    }
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error during deletion" });
  }
};
