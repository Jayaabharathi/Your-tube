import React, { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Camera, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

const ChannelHeader = ({ channel, user: channelOwner }: any) => {
  const { user, refetchUser } = useUser() as any;
  const [isSubscribed, setIsSubscribed] = useState(user?.subscriptions?.includes(channel?._id));
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubscribe = async () => {
    if (!user) return alert("Please login to subscribe");
    try {
      setLoading(true);
      await axiosInstance.patch(`/user/subscribe/${channel?._id}`, { userId: user._id });
      setIsSubscribed(!isSubscribed);
      await refetchUser();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axiosInstance.post("/user/upload-avatar", formData);
      const filepath = res.data.filepath;
      
      // Update user profile with the new image path
      await axiosInstance.patch(`/user/update/${user._id}`, {
        channelname: user.channelname,
        description: user.description,
        image: filepath
      });
      
      await refetchUser();
      alert("Profile picture updated!");
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden"></div>

      {/* Channel Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageChange}
          />
          <Avatar 
            className={`w-20 h-20 md:w-32 md:h-32 relative group ${user?._id === channel?._id ? "cursor-pointer" : ""}`}
            onClick={() => user?._id === channel?._id && fileInputRef.current?.click()}
          >
            <AvatarImage src={channel?.image ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${channel.image}` : ""} />
            <AvatarFallback className="text-2xl">
              {channel?.channelname ? channel.channelname[0] : "C"}
            </AvatarFallback>
            {user?._id === channel?._id && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    {loading ? <Loader2 className="animate-spin text-white w-8 h-8" /> : <Camera className="text-white w-8 h-8" />}
                </div>
            )}
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">{channel?.channelname}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>@{channel?.channelname?.toLowerCase().replace(/\s+/g, "")}</span>
            </div>
            {channel?.description && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {channel?.description}
              </p>
            )}
          </div>

          {user && user?._id !== channel?._id && (
            <div className="flex gap-2">
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                variant={isSubscribed ? "outline" : "default"}
                className={
                  isSubscribed ? "bg-secondary text-secondary-foreground" : "bg-red-600 hover:bg-red-700"
                }
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;
