import mongoose from "mongoose";

const commentSchema = mongoose.Schema({
  videoid: String,
  userid: String,
  usercommented: String,
  usercity: String,
  commentbody: String,

  likes: {
    type: [String],
    default: [], // ✅ REQUIRED
  },
  dislikes: {
    type: [String],
    default: [], // ✅ REQUIRED
  },

  commentedon: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Comment", commentSchema);
