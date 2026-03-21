import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user, refetchUser } = useUser() as any;
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    if (user && video) {
      const uploaderIdOrName = (video.uploader === "undefined" || !video.uploader) ? video.videochanel : video.uploader;
      
      const subscribed = user.subscriptions?.some((sub: any) => {
        // Handle populated objects
        if (sub && typeof sub === 'object') {
          return sub._id?.toString() === uploaderIdOrName || 
                 sub.name?.toLowerCase() === uploaderIdOrName?.toLowerCase() ||
                 sub.channelname?.toLowerCase() === uploaderIdOrName?.toLowerCase();
        }
        // Handle raw IDs
        return sub?.toString() === uploaderIdOrName;
      });
      
      setIsSubscribed(Boolean(subscribed));
    }
  }, [user, video]);

  const handleSubscribe = async () => {
    if (!user) return alert("Please login to subscribe");
    const isOwner = user._id?.toString() === video.uploader?.toString() || user.name === video.videochanel;
    if (isOwner) return;
    
    try {
      setSubLoading(true);
      console.log("Subscription Debug - UserID:", user?._id, "ChannelID:", video?.uploader);
      const effectiveChannelId = (video.uploader === "undefined" || !video.uploader) ? video.videochanel : video.uploader;
      const res = await axiosInstance.patch(`/user/subscribe/${effectiveChannelId}`, { userId: user._id });
      setIsSubscribed(!isSubscribed);
      alert(res.data.message || (isSubscribed ? "Unsubscribed!" : "Subscribed!"));
      await refetchUser();
    } catch (error: any) {
      console.error(error);
      alert("Subscription failed: " + (error?.response?.data?.message || error.message));
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
  }, [video]);

  useEffect(() => {
    const handleviews = async () => {
      if (user) {
        try {
          return await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } catch (error) {
          return console.log(error);
        }
      } else {
        return await axiosInstance.post(`/history/views/${video?._id}`);
      }
    };
    handleviews();
  }, [user, video._id]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.liked) {
        if (isLiked) {
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        } else {
          setlikes((prev: any) => prev + 1);
          setIsLiked(true);
          if (isDisliked) {
            setDislikes((prev: any) => prev - 1);
            setIsDisliked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      alert("Login required");
      return;
    }
    
    // 🔥 MOBILE FIX: Open the window synchronously BEFORE the await!
    // Mobile browsers (Safari/Chrome) immediately block window.open if it happens asynchronously.
    const downloadTab = window.open("", "_blank");
    if (!downloadTab) {
      alert("Please allow popups to download videos.");
      return;
    }

    try {
      const res = await axiosInstance.post("/download", {
        userid: user._id,
        videoid: video._id,
      });
      // Redirect the legally opened tab to the video URL
      downloadTab.location.href = res.data.videourl;
    } catch (error: any) {
      downloadTab.close();
      alert(error?.response?.data || "Download limit reached. Upgrade to premium");
    }
  };

  const handleWatchLater = async () => {
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (!res.data.liked) {
        if (isDisliked) {
          setDislikes((prev: any) => prev - 1);
          setIsDisliked(false);
        } else {
          setDislikes((prev: any) => prev + 1);
          setIsDisliked(true);
          if (isLiked) {
            setlikes((prev: any) => prev - 1);
            setIsLiked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this video?")) return;
    try {
      const res = await axiosInstance.delete(`/video/delete/${video._id}`);
      alert(res.data.message || "Video deleted!");
      window.location.href = "/";
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Delete failed";
      alert(`Delete Error: ${msg}`);
    }
  };

  const isOwner = Boolean(
    user && video && (
      user._id?.toString() === video.uploader?.toString() || 
      (user.name && video.videochanel && user.name.toLowerCase().trim() === video.videochanel.toLowerCase().trim()) ||
      (user.channelname && video.videochanel && user.channelname.toLowerCase().trim() === video.videochanel.toLowerCase().trim())
    )
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video.videochanel?.[0] || "V"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium">{video.videochanel}</h3>
            <p className="text-sm text-muted-foreground">@{video.videochanel?.toLowerCase().replace(/\s+/g, "")}</p>
          </div>
          {!isOwner && (
              <Button 
                onClick={handleSubscribe} 
                className={`ml-4 rounded-full font-bold px-6 ${isSubscribed ? "bg-secondary text-secondary-foreground" : "bg-red-600 hover:bg-red-700 text-white"}`}
                disabled={subLoading}
              >
                {subLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {isOwner && (
            <Button variant="ghost" size="sm" className="bg-red-600 text-white hover:bg-red-700 rounded-full font-bold h-9 px-4 shadow-lg shadow-red-600/20 flex-shrink-0" onClick={handleDelete}>
                <Trash2 className="w-5 h-5 mr-1" /> DELETE
            </Button>
          )}
          <div className="flex items-center bg-secondary/50 rounded-full">
            <Button variant="ghost" size="sm" className="rounded-l-full h-9 px-4" onClick={handleLike}>
              <ThumbsUp className={`w-5 h-5 mr-2 ${isLiked ? "fill-primary text-primary" : ""}`} />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="sm" className="rounded-r-full h-9 px-4" onClick={handleDislike}>
              <ThumbsDown className={`w-5 h-5 mr-2 ${isDisliked ? "fill-primary text-primary" : ""}`} />
              {dislikes.toLocaleString()}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className={`bg-secondary/50 rounded-full h-9 px-4 ${isWatchLater ? "text-primary bg-primary/20" : ""}`} onClick={handleWatchLater}>
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>
          <Button variant="ghost" size="sm" className="bg-secondary/50 rounded-full h-9 px-4">
            <Share className="w-5 h-5 mr-2" /> Share
          </Button>
          <Button variant="ghost" size="sm" className="bg-secondary/50 rounded-full h-9 px-4" onClick={handleDownload}>
            <Download className="w-5 h-5 mr-2" /> Download
          </Button>
          <Button variant="ghost" size="icon" className="bg-secondary/50 rounded-full w-9 h-9">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="bg-secondary/20 rounded-xl p-4">
        <div className="flex gap-4 text-sm font-bold mb-2">
          <span>{video.views?.toLocaleString() || 0} views</span>
          <span>{video.createdAt ? formatDistanceToNow(new Date(video.createdAt)) : "recently"} ago</span>
        </div>
        <div className={`text-sm leading-relaxed ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>{video.description || "No description provided."}</p>
        </div>
        <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto font-bold text-muted-foreground hover:text-foreground" onClick={() => setShowFullDescription(!showFullDescription)}>
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default VideoInfo;
