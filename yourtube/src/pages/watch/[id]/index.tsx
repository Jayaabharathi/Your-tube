"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";

import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

const Page = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const { user, login } = useUser() as any;

  const [video, setVideo] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH VIDEO
  // =========================
  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      try {
        const res = await axiosInstance.get(`/video/${id}`);
        setVideo(res.data);

        const all = await axiosInstance.get("/video/getall");
        setAllVideos(all.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  // =========================
  // GESTURE HOOKS
  // =========================
  const handleNextVideo = () => {
    if (allVideos.length > 0) {
      const currentIndex = allVideos.findIndex(v => v._id === id);
      const nextIndex = (currentIndex + 1) % allVideos.length;
      const nextVid = allVideos[nextIndex];
      if (nextVid) router.push(`/watch/${nextVid._id}`);
    }
  };

  // =========================
  // RAZORPAY PAYMENT HANDLER
  // =========================
  const handlePayment = async (planType: string, amount: number) => {
    if (!user) {
      alert("Login required");
      return;
    }

    try {
      const { data } = await axiosInstance.post(
        "/api/payment/create-order",
        { amount }
      );

      const options = {
        key: "rzp_test_SGkZDKaayoiGRk",
        amount: data.amount,
        currency: data.currency,
        name: `YourTube ${planType}`,
        description: `${planType} Subscription`,
        order_id: data.id,
        handler: async function (response: any) {
          await axiosInstance.post(
            "/api/payment/verify",
            {
              ...response,
              userId: user._id,
              planType,
              amount,
            }
          );

          // Force local storage session update so the badge persists post-reload
          if (login) login({ ...user, isPremium: true, planType: planType });
          
          alert(`Premium Activated 🎉\nEnjoy your ${planType} plan!`);
          window.location.reload();
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.log("Payment error:", error);
      alert("Payment failed");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!video) return <div>Video not found</div>;

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-500">

      {/* Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="max-w-7xl mx-auto md:px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT SIDE */}
          <div className="w-full lg:w-2/3 md:space-y-4">
            <Videopplayer video={video} onNextVideo={handleNextVideo} />
            <div className="px-4 md:px-0 space-y-4 pt-4 md:pt-0">
              <VideoInfo video={video} />

            {/* Download Premium Pass */}
            {user && !user.isPremium && (
              <div className="bg-secondary/10 p-4 md:p-6 rounded-2xl mb-4 border border-border shadow-inner">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg tracking-tight">Unlock Unlimited Downloads</h3>
                        <p className="text-xs text-muted-foreground">Free users get 1 download per day. Upgrade to Premium for unlimited offline downloads.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={() => handlePayment("Premium", 199)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 px-6 py-5 text-sm"
                        >
                            Buy Premium ₹199
                        </Button>
                    </div>
                </div>
              </div>
            )}

            {/* Watch Time Tiers */}
            {user && (!user.planType || user.planType !== "Gold") && (
              <div className="bg-secondary/10 p-4 md:p-6 rounded-2xl mb-4 border border-border shadow-inner">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg tracking-tight">Support this Creator</h3>
                        <p className="text-xs text-muted-foreground">Upgrade your viewing limits with a creator tier subscription.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(!user.planType || user.planType === "Free") && (
                        <Button
                            variant="ghost"
                            onClick={() => handlePayment("Bronze", 10)}
                            className="bg-[#CD7F32]/10 hover:bg-[#CD7F32] hover:text-white text-[#CD7F32] font-bold border border-[#CD7F32]/20 rounded-xl"
                        >
                            Bronze ₹10 (7m)
                        </Button>
                        )}
                        {(!user.planType || ["Free", "Bronze"].find(p => p === user.planType)) && (
                        <Button
                            variant="ghost"
                            onClick={() => handlePayment("Silver", 50)}
                            className="bg-slate-400/10 hover:bg-slate-400 hover:text-white text-slate-500 font-bold border border-slate-400/20 rounded-xl"
                        >
                            Silver ₹50 (10m)
                        </Button>
                        )}
                        <Button
                            onClick={() => handlePayment("Gold", 100)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold rounded-xl shadow-lg shadow-yellow-500/20"
                        >
                            Gold ₹100 (∞)
                        </Button>
                    </div>
                </div>
              </div>
            )}



            <div id="comments-section">
              <Comments videoId={id} />
            </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="w-full lg:w-1/3 px-4 md:px-0">
            <RelatedVideos videos={allVideos} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Page;
