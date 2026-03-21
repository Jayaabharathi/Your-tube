import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Trash2 } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  usercity: string;
  commentedon: string;
  likes: string[];
  dislikes: string[];
}

const Comments = ({ videoId }: { videoId: string }) => {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      let city = "Unknown City";
      try {
        const locationRes = await fetch("https://ipapi.co/json/");
        const locationData = await locationRes.json();
        if (locationData.city) {
          city = locationData.city;
        }
      } catch (locErr) {
        console.error("Failed to fetch location", locErr);
      }

      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        city: city,
      });

      setComments((prev) => [res.data, ...prev]);
      setNewComment("");
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Comment failed";

      alert(message);
    }
  };

  const handleLike = async (id: string) => {
    if (!user) return alert("Login required");
    await axiosInstance.post(`/comment/like/${id}`, { userid: user._id });
    loadComments();
  };

  const handleDislike = async (id: string) => {
    if (!user) return alert("Login required");
    try {
      const res = await axiosInstance.post(`/comment/dislike/${id}`, { userid: user._id });
      if (res.data.deleted) {
        setComments((prev) => prev.filter((c) => c._id !== id));
        alert("Comment was removed because it received too many dislikes.");
      } else {
        loadComments();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTranslate = async (text: string, lang: string, commentId: string) => {
    if (!lang) return;
    try {
      const res = await axiosInstance.post("/comment/translate", {
        text,
        targetLang: lang,
      });
      setTranslations((prev) => ({ ...prev, [commentId]: res.data.translatedText }));
    } catch (error) {
      console.error("Translation failed", error);
      alert("Translation failed");
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await axiosInstance.delete(`/comment/deletecomment/${id}`);
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading) return <p>Loading comments...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {user && (
        <div className="flex gap-4">
          <Avatar>
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
            />
            <div className="flex justify-end mt-2">
              <Button onClick={handleSubmitComment}>Comment</Button>
            </div>
          </div>
        </div>
      )}

      {comments.map((comment) => (
        <div key={comment._id} className="flex gap-3 md:gap-4">
          <Avatar className="w-8 h-8 md:w-10 md:h-10">
            <AvatarFallback className="text-xs md:text-sm">
              {comment.usercommented?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="text-sm font-medium">
              {comment.usercommented} • {comment.usercity || "Unknown City"}
            </div>

            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.commentedon))} ago
            </div>

            <p className="mt-1 text-sm md:text-base leading-relaxed">{comment.commentbody}</p>
            
            {translations[comment._id] && (
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                Translated: {translations[comment._id]}
              </p>
            )}

            <div className="flex gap-3 text-sm mt-2">
              <button onClick={() => handleLike(comment._id)}>
                👍 {comment.likes.length}
              </button>
              <button onClick={() => handleDislike(comment._id)}>
                👎 {comment.dislikes.length}
              </button>
              <select
                onChange={(e) => {
                  handleTranslate(comment.commentbody, e.target.value, comment._id);
                  e.target.value = "";
                }}
                defaultValue=""
                className="bg-transparent text-sm cursor-pointer outline-none w-24 hover:text-blue-500 transition-colors"
                title="Translate Comment"
              >
                <option value="" disabled>🌐 Lang</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="ta">Tamil</option>
              </select>

              {user?._id === comment.userid && (
                <button 
                  onClick={() => handleDeleteComment(comment._id)}
                  className="text-muted-foreground hover:text-red-500 transition-colors ml-auto"
                  title="Delete Comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Comments;
