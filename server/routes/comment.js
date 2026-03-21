import express from "express";
import {
  deletecomment,
  getallcomment,
  postcomment,
  editcomment,
  likeComment,
  dislikeComment,
  translateComment,
} from "../controllers/comment.js";

const routes = express.Router();

/* ===========================
   COMMENT ROUTES
=========================== */

// CREATE
routes.post("/postcomment", postcomment);

// EDIT
routes.post("/editcomment/:id", editcomment);

// LIKE / DISLIKE
routes.post("/like/:id", likeComment);
routes.post("/dislike/:id", dislikeComment);

// TRANSLATE
routes.post("/translate", translateComment);

// DELETE
routes.delete("/deletecomment/:id", deletecomment);

// GET (KEEP THIS LAST)
routes.get("/:videoid", getallcomment);

export default routes;

