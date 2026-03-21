import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@/lib/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import axiosInstance from "@/lib/axiosinstance";

export default function OTPModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login } = useUser();
  const [region, setRegion] = useState("");
  const [isSouthIndia, setIsSouthIndia] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state if opened again securely
      setStep(1);
      setOtp("");
      setInputVal("");
      
      axios.get("https://ipapi.co/json/").then((res) => {
        const userRegion = res.data.region;
        setRegion(userRegion);
        setIsSouthIndia(["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"].includes(userRegion));
      }).catch(err => {
        console.error("Geolocation bypass failed: Defaults applied.", err);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOTP = async () => {
    if (!inputVal) return alert("Please establish a valid endpoint identity.");
    setLoading(true);
    try {
       // Bypassing Render block by invoking the newly minted Vercel Serverless Function correctly
       const res = await axios.post("/api/send-otp", {
         region,
         email: isSouthIndia ? inputVal : undefined,
         mobileNumber: !isSouthIndia ? inputVal : undefined,
       });
       if (res.data && res.data.message) {
         alert(res.data.message);
       }
       setStep(2);
    } catch(err: any) {
       alert("Network exception: " + (err.response?.data?.detail || err.response?.data?.message || err.message || "Unknown error"));
    } finally {
       setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) return alert("Please supply the 6-digit identification packet.");
    setLoading(true);
    try {
       const res = await axiosInstance.post("/user/verify-otp", {
         otp,
         email: isSouthIndia ? inputVal : undefined,
         mobileNumber: !isSouthIndia ? inputVal : undefined,
       });
       // Natively override context state securely
       login(res.data.result);
       onClose();
    } catch(err: any) {
       alert(err.response?.data?.message || "Invalid payload signature matched.");
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background text-foreground p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl relative border border-border">
        {/* DEV SPOOFER */}
        <div className="absolute top-5 left-5">
          <select 
            className="text-xs border border-border rounded p-1 bg-secondary text-foreground outline-none cursor-pointer"
            value={region}
            onChange={(e) => {
              const newReg = e.target.value;
              setRegion(newReg);
              setIsSouthIndia(["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"].includes(newReg));
              setInputVal("");
              setStep(1);
            }}
          >
            <option value="Tamil Nadu">📍 Spoof: South India</option>
            <option value="Delhi">📍 Spoof: North India</option>
          </select>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors font-bold text-xl">✕</button>
        <h2 className="text-xl md:text-2xl font-bold mb-2 mt-6 md:mt-4">Sign In Securely</h2>
        
        {step === 1 ? (
          <div>
            <p className="mb-5 text-sm text-gray-500 font-medium">
              {isSouthIndia 
                ? "You are authenticating from South India. For optimum regional security, please verify via Email Address."
                : "You are authenticating from a primary Northern/International geography. Please verify via Mobile Number."}
            </p>
            <Input 
              type={isSouthIndia ? "email" : "tel"} 
              placeholder={isSouthIndia ? "name@example.com" : "+91 XXXXXXXXXX"} 
              value={inputVal} 
              onChange={(e) => setInputVal(e.target.value)} 
              className="mb-4 h-12"
            />
            <Button onClick={handleSendOTP} disabled={loading} className="w-full h-12 text-base font-semibold">
              {loading ? "Generating Packet..." : "Request Auth Signature"}
            </Button>
          </div>
        ) : (
          <div>
            <p className="mb-5 text-sm text-muted-foreground font-medium font-mono text-center">
              Enter the 6-digit secure sequence mapped to <br/><span className="text-foreground font-bold">{inputVal}</span>
            </p>
            <Input 
              type="text" 
              placeholder="000000" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              className="mb-4 h-14 text-center text-2xl tracking-[0.5em] font-mono shadow-inner" 
              maxLength={6}
            />
            <Button onClick={handleVerifyOTP} disabled={loading} className="w-full h-12 text-base font-semibold">
              {loading ? "Decrypting..." : "Verify & Sign In Natively"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
