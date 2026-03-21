"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Trash2 } from "lucide-react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

// Build URL exactly the same way Videopplayer does
function buildVideoUrl(filepath: string) {
  // Replace Windows backslashes with forward slashes
  const cleanPath = filepath?.replace(/\\/g, "/") || "";
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  return `${base}/${cleanPath}`;
}

function ThumbnailVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [frameReady, setFrameReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMeta = () => {
      // Create a predictable unique number from the filename to pick a unique frame for each video
      let hash = 0;
      for (let i = 0; i < src.length; i++) {
        hash = src.charCodeAt(i) + ((hash << 5) - hash);
      }
      const randomPercent = Math.abs(hash) % 100 / 100; // 0.0 to 0.99
      
      // Seek somewhere between 5% and 80% of the video duration based on the unique hash
      const targetTime = el.duration * (0.05 + Math.min(randomPercent, 0.75));
      el.currentTime = targetTime || 1;
    };

    const onSeeked = () => setFrameReady(true);

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("seeked", onSeeked);
    // If metadata loads but seeked never fires, show after 1s
    const timer = setTimeout(() => setFrameReady(true), 1500);

    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("seeked", onSeeked);
      clearTimeout(timer);
    };
  }, [src]);

  return (
    <div className="w-full h-full relative bg-zinc-900">
      <video
        ref={ref}
        src={src}
        preload="metadata"
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: frameReady ? 1 : 0 }}
      />
      {!frameReady && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
      )}
    </div>
  );
}

export default function VideoCard({ video }: any) {
  const { user } = useUser() as any;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      await axiosInstance.delete(`/video/delete/${video._id}`);
      window.location.reload();
    } catch {
      alert("Delete failed");
    }
  };

  const isOwner = Boolean(
    user && video && (
      user._id?.toString() === video.uploader?.toString() ||
      (user.name && video.videochanel && user.name.toLowerCase().trim() === video.videochanel.toLowerCase().trim()) ||
      (user.channelname && video.videochanel && user.channelname.toLowerCase().trim() === video.videochanel.toLowerCase().trim())
    )
  );

  const videoUrl = buildVideoUrl(video?.filepath);

  return (
    <Link href={`/watch/${video?._id}`} className="group block">
      <div className="space-y-3">
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 group-hover:shadow-lg transition-shadow">
          <ThumbnailVideo src={videoUrl} />
          {video?.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono z-10">
              {video.duration}
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback>{video?.videochanel?.[0]?.toUpperCase() || "V"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {video?.videotitle}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{video?.videochanel}</p>
            <p className="text-xs text-muted-foreground">
              {video?.views?.toLocaleString() || 0} views •{" "}
              {video?.createdAt ? formatDistanceToNow(new Date(video.createdAt)) : "recently"} ago
            </p>
          </div>
          {isOwner && (
            <button
              onClick={handleDelete}
              className="mt-1 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-all self-start flex-shrink-0"
              title="Delete Video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
