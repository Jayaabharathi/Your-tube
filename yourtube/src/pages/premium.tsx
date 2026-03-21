import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axiosinstance";

export default function Premium() {
  const handlePayment = async () => {
    try {
      const { data } = await axiosInstance.post("/api/payment/create-order");

      const options = {
        key: "rzp_test_SGkZDKaayoiGRk",
        amount: data.amount,
        currency: data.currency,
        name: "YourTube Premium",
        description: "Ad-free experience & Downloads",
        order_id: data.id,
        handler: async function (response: any) {
          try {
            await axiosInstance.post("/api/payment/verify", {
              ...response,
              userId: localStorage.getItem("userId") || "",
            });
            alert("Welcome to the Premium family! 🎉");
            window.location.reload();
          } catch (e) {
            alert("Verification failed. Please contact support.");
          }
        },
        theme: { color: "#ef4444" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Encryption handshake failed. Please check network.");
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] bg-gradient-to-b from-background to-secondary/20 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-background border border-border p-8 rounded-3xl shadow-2xl space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto rotate-3 mb-4 shadow-lg shadow-red-600/20">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">YourTube Premium</h1>
          <p className="text-muted-foreground text-sm">Elevate your streaming experience natively.</p>
        </div>

        <div className="space-y-4 py-4">
          {[
            "Ad-free video playback",
            "High-bitrate 1080p streaming",
            "Unlimited offline downloads",
            "Early access to new features",
            "Premium badge on profile"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="bg-green-500/10 p-1 rounded-full text-green-500">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">{feature}</span>
            </div>
          ))}
        </div>

        <div className="p-1 bg-secondary rounded-2xl">
            <div className="bg-background rounded-xl p-6 text-center shadow-inner">
                <div className="text-4xl font-extrabold tracking-tight">₹199<span className="text-sm text-muted-foreground font-normal">/month</span></div>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Cancel anytime natively</p>
            </div>
        </div>

        <Button 
          onClick={handlePayment} 
          className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-lg font-bold shadow-xl shadow-red-600/20 group overflow-hidden relative"
        >
          <span className="relative z-10">UPGRADE NOW</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Button>
      </div>
    </div>
  );
}

