import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";

const Videogrid = ({ uploaderFilters }: { uploaderFilters?: string[] }) => {
  const [videos, setvideo] = useState<any>(null);
  const [loading, setloading] = useState(true);
  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        setvideo(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, []);

  // const videos = [
  //   {
  //     _id: "1",
  //     videotitle: "Amazing Nature Documentary",
  //     filename: "nature-doc.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/nature-doc.mp4",
  //     filesize: "500MB",
  //     videochanel: "Nature Channel",
  //     Like: 1250,
  //     views: 45000,
  //     uploader: "nature_lover",
  //     createdAt: new Date().toISOString(),
  //   },
  //   {
  //     _id: "2",
  //     videotitle: "Cooking Tutorial: Perfect Pasta",
  //     filename: "pasta-tutorial.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/pasta-tutorial.mp4",
  //     filesize: "300MB",
  //     videochanel: "Chef's Kitchen",
  //     Like: 890,
  //     views: 23000,
  //     uploader: "chef_master",
  //     createdAt: new Date(Date.now() - 86400000).toISOString(),
  //   },
  // ];
  return (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {loading ? (
  <>Loading...</>
) : (
  Array.isArray(videos) &&
  videos
    .filter((v: any) => {
      if (!uploaderFilters) return true;
      return uploaderFilters.some((sub: any) => {
        const subId = typeof sub === 'object' ? sub._id?.toString() : sub?.toString();
        const subName = typeof sub === 'object' ? sub.name?.toLowerCase() : null;
        const subChannelName = typeof sub === 'object' ? sub.channelname?.toLowerCase() : null;
        
        const videoUploader = v.uploader?.toString();
        const videoChannel = v.videochanel?.toLowerCase();
        
        return subId === videoUploader || 
               (videoUploader === "undefined" && (subName === videoChannel || subChannelName === videoChannel)) ||
               (subName === videoChannel || subChannelName === videoChannel);
      });
    })
    .map((video: any) => (
      <Videocard key={video._id} video={video} />
    ))
)}
{Array.isArray(videos) && videos.filter((v: any) => !uploaderFilters || uploaderFilters.includes(v.uploader)).length === 0 && !loading && (
    <div className="col-span-full text-center py-20 text-muted-foreground">
        No videos found. Try exploring new channels!
    </div>
)}
</div>


  );
};

export default Videogrid;