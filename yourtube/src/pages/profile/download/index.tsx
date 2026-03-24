import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

const DownloadPage = () => {
  const { user } = useUser();
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    if (!user) return;

    axiosInstance
      .get(`/download/${user._id}`)
      .then((res) => setDownloads(res.data))
      .catch(console.log);
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Your Downloads</h1>

      {downloads.length === 0 && <p>No downloads yet</p>}

      <div className="space-y-4">
        {downloads.map((item: any) => (
          <div
            key={item._id}
            className="flex items-center gap-4 border p-3 rounded"
          >
            <video
              src={item.videoId?.filepath ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${item.videoId.filepath.replace(/\\/g, "/")}` : ""}
              className="w-40 h-24 object-cover rounded bg-black"
              preload="metadata"
              controls
            />
            <div>
              <h3 className="font-semibold text-lg">
                {item.videoId?.videotitle || "Video processing or deleted"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Downloaded on{" "}
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadPage;


