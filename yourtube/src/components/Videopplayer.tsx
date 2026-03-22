"use client";

import { useRef, useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import { FastForward, Rewind, Play, Pause, ChevronDown } from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  onNextVideo?: () => void;
}

export default function VideoPlayer({ video, onNextVideo }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();
  const router = useRouter();
  
  const [feedback, setFeedback] = useState<{ type: string; visible: boolean }>({ type: "", visible: false });
  const tapState = useRef<{ count: number; zone: string; timeout: any }>({ count: 0, zone: "", timeout: null });

  const showFeedback = (type: string) => {
    setFeedback({ type, visible: true });
    setTimeout(() => setFeedback(prev => ({ ...prev, visible: false })), 600);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoElement = e.currentTarget;
    const currentTime = videoElement.currentTime;
    
    // Free users get 5 minutes. Premium users get unlimited watch time.
    const limit = user?.isPremium ? Infinity : 5 * 60;

    if (currentTime >= limit) {
      videoElement.pause();
      videoElement.currentTime = limit - 0.5; // Prevent auto-resume exploit
      alert(`Free accounts can only watch the first 5 minutes of a video. Please Upgrade to Premium for unlimited watch time and downloads!`);
    }
  };

  const executeGesture = (count: number, zone: string) => {
    if (!videoRef.current) return;
    const v = videoRef.current;

    // 1️⃣ Single Clicks
    if (count === 1) {
      if (zone === "center") {
        if (v.paused) {
          v.play();
          showFeedback("play");
        } else {
          v.pause();
          showFeedback("pause");
        }
      }
    } 
    // 2️⃣ Double Clicks
    else if (count === 2) {
      if (zone === "right") {
        v.currentTime += 10;
        showFeedback("forward");
      } else if (zone === "left") {
        v.currentTime -= 10;
        showFeedback("backward");
      }
    } 
    // 3️⃣ Triple Clicks
    else if (count === 3) {
      if (zone === "center") {
        if (onNextVideo) onNextVideo();
      } else if (zone === "right") {
        router.push("/");
        setTimeout(() => window.close(), 100);
      } else if (zone === "left") {
        const commentSection = document.getElementById("comments-section");
        if (commentSection) {
          commentSection.scrollIntoView({ behavior: "smooth" });
          showFeedback("comments");
        }
      }
    }
  };

  const handleZoneClick = (zone: "left" | "center" | "right") => {
    const state = tapState.current;

    if (state.zone !== zone) {
      state.count = 0;
      state.zone = zone;
    }

    state.count += 1;

    if (state.timeout) clearTimeout(state.timeout);

    state.timeout = setTimeout(() => {
      const finalCount = state.count;
      const finalZone = state.zone;
      state.count = 0;
      state.zone = "";
      
      executeGesture(finalCount, finalZone);
    }, 280);
  };

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        onTimeUpdate={handleTimeUpdate}
        poster={`/placeholder.svg?height=480&width=854`}
      >
        <source
          src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${video?.filepath}`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Transparent Gesture Overlay locked strictly to the Top 80% */}
      <div className="absolute top-0 left-0 right-0 bottom-[20%] flex z-10 select-none">
        <div className="flex-1 cursor-pointer relative" onClick={() => handleZoneClick("left")}>
            {feedback.visible && feedback.type === "backward" && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 rounded-full animate-ping opacity-50">
                    <Rewind className="w-12 h-12 text-white" />
                </div>
            )}
        </div>
        <div className="flex-1 cursor-pointer relative" onClick={() => handleZoneClick("center")}>
            {feedback.visible && (feedback.type === "play" || feedback.type === "pause") && (
                <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                    {feedback.type === "play" ? <Play className="w-16 h-16 text-white fill-white" /> : <Pause className="w-16 h-16 text-white fill-white" />}
                </div>
            )}
        </div>
        <div className="flex-1 cursor-pointer relative" onClick={() => handleZoneClick("right")}>
            {feedback.visible && feedback.type === "forward" && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 rounded-full animate-ping opacity-50">
                    <FastForward className="w-12 h-12 text-white" />
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
