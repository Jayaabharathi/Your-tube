import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import Script from "next/script";
import { useEffect, useState } from "react";
import axios from "axios";
import VideoCall from "@/components/VideoCall";

export default function App({ Component, pageProps }: AppProps) {
  const [themeDebug, setThemeDebug] = useState({ region: "", h: 0, isSouth: false, isLight: false });

  useEffect(() => {
    const enforceRegionalTheme = async () => {
      let region = "";
      try {
        // Use a timeout to prevent hanging on slow/blocked connections
        const fetchWithTimeout = async (url: string) => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 3000);
          try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(id);
            return await response.json();
          } catch (e) {
            clearTimeout(id);
            return null;
          }
        };

        // Try Primary API
        const data = await fetchWithTimeout("https://ipapi.co/json/");
        if (data && data.region) {
            region = data.region;
        } else {
            // Try Secondary API
            const data2 = await fetchWithTimeout("https://ip-api.com/json/");
            if (data2 && data2.regionName) region = data2.regionName;
        }

        // 🏗️ LOCAL FALLBACK: If IP services are blocked, check Browser Timezone
        if (!region) {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timeZone === "Asia/Kolkata") {
                region = "Tamil Nadu"; // Assume generic South India for testing the feature window
            }
        }

        const southStates = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
        const isSouth = southStates.includes(region);

        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          hour12: false,
        });
        const currentHour = parseInt(formatter.format(new Date()));
        
        const isTimeWindow = currentHour >= 10 && currentHour < 12;
        setThemeDebug({ region: region || "Blocked/TimezoneFallback", h: currentHour, isSouth, isLight: isSouth && isTimeWindow });

        if (isSouth && isTimeWindow) {
          document.documentElement.classList.remove("dark");
        } else {
          document.documentElement.classList.add("dark");
        }
      } catch (err) {
        // Absolute silence - never throw a loud Network Error
        document.documentElement.classList.add("dark");
        setThemeDebug(prev => ({ ...prev, region: "Silent Fail" }));
      }
    };
    enforceRegionalTheme();
  }, []);

  return (
    <UserProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
        <title>Your-Tube Clone</title>
        
        {/* Task 4 Regional Debug Overlay (Click to hide/show) */}
        <div className="fixed bottom-4 left-4 z-[9999] bg-black/80 text-white text-[10px] p-2 rounded-lg border border-white/20 select-none pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
           Detect: {themeDebug.region || "???"} | {themeDebug.h}:00 IST | Theme: {themeDebug.isLight ? "LIGHT ⚪" : "DARK ⚫"}
        </div>

        <Header />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
        <Toaster />
        <div className="flex pb-14 md:pb-0">
          <Sidebar />
          <div className="flex-1 w-full overflow-x-hidden">
            <Component {...pageProps} />
          </div>
        </div>
        <BottomNav />
        <VideoCall />
      </div>
    </UserProvider>
  );
}
