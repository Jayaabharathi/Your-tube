"use client";
import React, { useRef } from "react";

export default function VideoThumbnail({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 1;
  };

  return (
    <video
      ref={videoRef}
      src={src}
      className={`w-full h-full object-cover ${className || ""}`}
      preload="metadata"
      muted
      playsInline
      onLoadedMetadata={() => {
        if (videoRef.current) videoRef.current.currentTime = 1;
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
}
