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
            <img
              src={item.videoId.thumbnail}
              className="w-40 rounded"
            />
            <div>
              <h3 className="font-semibold">
                {item.videoId.videotitle}
              </h3>
              <p className="text-sm text-gray-500">
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


