import Comment from "../Modals/comment.js";
import User from "../Modals/Auth.js";
import mongoose from "mongoose";
/* ===========================
   POST COMMENT (ALLOW ALL)
=========================== */
export const postcomment = async (req, res) => {
  try {
    const { videoid, userid, commentbody, city } = req.body;
    if (!commentbody || !commentbody.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }
    const specialCharsRegex = /[@#$%^&*<>~|]/;
    if (specialCharsRegex.test(commentbody)) {
      return res.status(400).json({ message: "Comments with special characters are not allowed" });
    }
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const newComment = new Comment({
      videoid,
      userid,
      usercommented: user.name,
      usercity: city || "Unknown City",
      commentbody,              // ✅ ANY LANGUAGE
      likes: [],
      dislikes: [],
      commentedon: new Date(),
    });
    await newComment.save();
    res.status(200).json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
/* ===========================
   GET COMMENTS
=========================== */
export const getallcomment = async (req, res) => {
  try {
    const { videoid } = req.params;
    const comments = await Comment.find({ videoid }).sort({
      commentedon: -1,
    });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
/* ===========================
   DELETE COMMENT
=========================== */
export const deletecomment = async (req, res) => {
  const { id } = req.params;
  try {
    await Comment.findByIdAndDelete(id);
    res.status(200).json({ comment: true });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};
/* ===========================
   LIKE COMMENT
=========================== */
export const likeComment = async (req, res) => {
  const { id } = req.params;
  const { userid } = req.body;
  const comment = await Comment.findById(id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  if (!comment.likes.includes(userid)) {
    comment.likes.push(userid);
    comment.dislikes = comment.dislikes.filter((u) => u !== userid);
  }
  await comment.save();
  res.json(comment);
};
/* ===========================
   DISLIKE COMMENT
=========================== */
export const dislikeComment = async (req, res) => {
  const { id } = req.params;
  const { userid } = req.body;
  const comment = await Comment.findById(id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  if (!comment.dislikes.includes(userid)) {
    comment.dislikes.push(userid);
    comment.likes = comment.likes.filter((u) => u !== userid);
  }
  if (comment.dislikes.length >= 2) {
    await Comment.findByIdAndDelete(id);
    return res.json({ deleted: true, _id: id });
  }
  await comment.save();
  res.json(comment);
};
/* ===========================
   EDIT COMMENT
=========================== */
export const editcomment = async (req, res) => {
  const { id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Comment unavailable");
  }
  const updated = await Comment.findByIdAndUpdate(
    id,
    { commentbody },
    { new: true }
  );
  res.status(200).json(updated);
};
/* ===========================
   TRANSLATE COMMENT
=========================== */
export const translateComment = async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
    const data = await response.json();
    const translatedText = data[0].map((item) => item[0]).join("");
    res.status(200).json({ translatedText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Translation failed" });
  }
};