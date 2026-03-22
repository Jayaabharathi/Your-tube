"use client";

import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { Video, VideoOff, Mic, MicOff, MonitorUp, Square, Download, X, Phone } from "lucide-react";
import { Button } from "./ui/button";

const getSocketUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== "undefined" 
  ? `http://${window.location.hostname}:5000` 
  : "http://localhost:5000");

export default function VideoCall() {
  const [socket, setSocket] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    const s = io(getSocketUrl());
    setSocket(s);

    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-video-call', handleOpen);
    
    return () => {
        s.disconnect();
        window.removeEventListener('open-video-call', handleOpen);
    };
  }, []);

  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const [callStatus, setCallStatus] = useState("Idle");

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const generateRandomRoom = () => {
    const randomId = Math.random().toString(36).substring(7).toUpperCase();
    setRoomId(randomId);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", async (id: string) => {
      console.log("User joined room:", id);
      setCallStatus("User Joined. Sending Offer...");
      
      // If the old connection died because they left earlier, respawn it!
      let pc = peerRef.current;
      if (!pc || pc.connectionState === "closed") {
          pc = await initWebRTC();
          if (localStream) {
             localStream.getTracks().forEach(t => pc?.addTrack(t, localStream));
          }
      }

      const offer = await pc!.createOffer();
      await pc!.setLocalDescription(offer);
      socket.emit("signal", { to: id, from: socket.id, signal: offer });
    });

    socket.on("signal", async ({ from, signal }: { from: string, signal: any }) => {
      if (from === socket.id) return;
      
      // Safety net for answers if peerRef was destroyed
      if (!peerRef.current || peerRef.current.connectionState === "closed") {
          const pc = await initWebRTC();
          if (localStream) {
             localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
          }
      }

      try {
        if (signal.type === "offer") {
          setCallStatus("Receiving Offer...");
          await peerRef.current!.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peerRef.current!.createAnswer();
          await peerRef.current!.setLocalDescription(answer);
          socket.emit("signal", { to: from, from: socket.id, signal: answer });
          setCallStatus("Answer Sent");
        } else if (signal.type === "answer") {
          setCallStatus("Finalizing Connection...");
          await peerRef.current!.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          if (peerRef.current!.remoteDescription) {
            await peerRef.current!.addIceCandidate(new RTCIceCandidate(signal));
          }
        }
      } catch (err) {
        console.error("Signaling error:", err);
      }
    });

    socket.on("user-left", (id: string) => {
      console.log("User left room:", id);
      setCallStatus("Friend left the room. Waiting for them to rejoin...");
      setRemoteStream(null); 
      
      // Dismantle the dead peer connection securely so a new one can be born when they return
      if (peerRef.current) {
         peerRef.current.close();
         peerRef.current = null;
      }
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("signal");
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
    }
  }, [isVideoOff, localStream]);

  const initWebRTC = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("signal", { to: roomId, from: socket.id, signal: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.oniceconnectionstatechange = () => {
        setCallStatus(`P2P: ${pc.iceConnectionState}`);
    };

    peerRef.current = pc;
    return pc;
  };

  const startCall = async () => {
    if (!roomId) return alert("Please enter a Room ID");
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("CAMERA_UNAVAILABLE_INSECURE_CONTEXT");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
            facingMode: "user",
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
            frameRate: { ideal: 24, max: 30 }
        }, 
        audio: true 
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // iOS Safari strictly requires imperative play execution for WebRTC blobs
        localVideoRef.current.play().catch(e => console.error("Safari autoplay block:", e));
      }
      
      const pc = await initWebRTC();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      if (socket) socket.emit("join-call-room", roomId);
      setIsCalling(true);
      setCallStatus("Joined Room. Waiting...");
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.message === "CAMERA_UNAVAILABLE_INSECURE_CONTEXT") {
        alert("🚨 Browser Security Block: Camera/Mic access is only allowed over HTTPS or Localhost. Since you are using a network IP, please enable HTTPS or follow the 'Insecure Origin' workaround.");
      } else {
        alert("Please allow camera/mic access in your browser settings.");
      }
    }
  };

  const endCall = () => {
    if (roomId && socket) socket.emit("leave-call-room", roomId);
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    peerRef.current?.close();
    setIsCalling(false);
    setCallStatus("Idle");
    if (isRecording) stopRecording();
  };

  const toggleScreenShare = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        return alert("Screen sharing is not supported on this device/browser (Mobile browsers often don't allow this). Please use a Desktop browser.");
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { frameRate: { ideal: 15, max: 20 } },
        audio: true 
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      const audioTrack = screenStream.getAudioTracks()[0];
      
      if (peerRef.current) {
        const senders = peerRef.current.getSenders();
        const vSender = senders.find(s => s.track?.kind === "video");
        const aSender = senders.find(s => s.track?.kind === "audio");

        if (vSender) vSender.replaceTrack(videoTrack);
        if (audioTrack && aSender) aSender.replaceTrack(audioTrack);
      }
      
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      
      videoTrack.onended = () => stopScreenShare();
    } catch (err: any) {
      console.error("Screen share error:", err);
      alert(`Screen share failed: ${err.message || err.name}.\n\nNote: Apple iOS and Android OS aggressively block websites from capturing the phone screen. Please demonstrate this feature on a Desktop/Laptop!`);
    }
  };

  const stopScreenShare = () => {
    if (localStream) {
      const cameraTrack = localStream.getVideoTracks()[0];
      const micTrack = localStream.getAudioTracks()[0];
      
      if (peerRef.current) {
        const senders = peerRef.current.getSenders();
        const vSender = senders.find(s => s.track?.kind === "video");
        const aSender = senders.find(s => s.track?.kind === "audio");

        if (cameraTrack && vSender) vSender.replaceTrack(cameraTrack);
        if (micTrack && aSender) aSender.replaceTrack(micTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    }
  };

  const startRecording = () => {
    if (!localStream && !remoteStream) return;
    
    const combinedStream = new MediaStream();
    if (remoteStream) remoteStream.getTracks().forEach(t => combinedStream.addTrack(t));
    else if (localStream) localStream.getTracks().forEach(t => combinedStream.addTrack(t));

    const recorder = new MediaRecorder(combinedStream);
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `call-record-${Date.now()}.webm`;
      a.click();
    };
    
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <>
      <div className="fixed bottom-20 right-8 z-[100]">
        <Button 
          onClick={() => setIsOpen(true)} 
          className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 shadow-xl"
        >
          <Video className="w-6 h-6" />
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md md:p-4">
          <div className="bg-background border border-border md:rounded-3xl w-full h-full md:h-auto md:max-w-4xl overflow-hidden shadow-2xl relative">
            <button onClick={() => { setIsOpen(false); endCall(); }} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground z-50">
              <X className="w-8 h-8" />
            </button>

            {!isCalling ? (
              <div className="p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Phone className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold">Start Video Call</h2>
                <p className="text-muted-foreground">Enter a Room Name to connect with friends</p>
                <div className="flex flex-col gap-2 max-w-sm mx-auto">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter Room Name" 
                      className="flex-1 bg-secondary p-3 rounded-xl outline-none border border-border"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                    />
                    <Button onClick={startCall} className="bg-red-600 hover:bg-red-700 h-full px-8 rounded-xl font-bold">JOIN</Button>
                  </div>
                  <button onClick={generateRandomRoom} className="text-xs text-muted-foreground hover:text-foreground underline">Generate Random Room ID</button>
                </div>
              </div>
            ) : (
              <div className="h-full md:h-[70vh] flex flex-col">
                <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden bg-black/20">
                    <div className="flex-1 rounded-2xl overflow-hidden bg-black relative border border-white/10 group min-h-[300px]">
                        <div className="absolute top-4 right-4 bg-red-600/80 text-white text-[10px] px-2 py-1 rounded-full font-bold animate-pulse z-50">
                            STATUS: {callStatus.toUpperCase()}
                        </div>
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity">Friend Stream</div>
                        {!remoteStream && (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-secondary/10">
                                Waiting for friend to join...
                            </div>
                        )}
                    </div>
                    <div className="w-full md:w-64 h-48 md:h-60 rounded-2xl overflow-hidden bg-secondary relative border border-white/20 shadow-xl md:self-end">
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-black/50 px-2 py-0.5 rounded text-[10px]">You</div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row p-4 md:p-6 bg-secondary/10 items-center justify-center gap-4 border-t border-border/50">
                    <div className="flex flex-col w-full md:w-auto md:mr-auto mb-2 md:mb-0 items-center md:items-start">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">In Room:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-red-500">{roomId}</span>
                            <Button variant="ghost" size="sm" onClick={copyRoomId} className="h-6 px-2 text-[10px] bg-white/5">
                                {copied ? "COPIED!" : "COPY ID"}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsMuted(!isMuted)} 
                            className={`rounded-full w-10 h-10 md:w-12 md:h-12 flex-shrink-0 ${isMuted ? "bg-red-600/20 text-red-600" : "bg-white/10"}`}
                        >
                            {isMuted ? <MicOff className="w-4 h-4 md:w-6 md:h-6" /> : <Mic className="w-4 h-4 md:w-6 md:h-6" />}
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsVideoOff(!isVideoOff)} 
                            className={`rounded-full w-10 h-10 md:w-12 md:h-12 flex-shrink-0 ${isVideoOff ? "bg-red-600/20 text-red-600" : "bg-white/10"}`}
                        >
                            {isVideoOff ? <VideoOff className="w-4 h-4 md:w-6 md:h-6" /> : <Video className="w-4 h-4 md:w-6 md:h-6" />}
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={toggleScreenShare} 
                            className="rounded-full w-10 h-10 md:w-12 md:h-12 bg-white/10 flex-shrink-0"
                            title="Share YouTube Screen"
                        >
                            <MonitorUp className="w-4 h-4 md:w-6 md:h-6" />
                        </Button>
                        <Button 
                            onClick={isRecording ? stopRecording : startRecording} 
                            className={`rounded-full px-4 md:px-6 h-10 md:h-12 flex gap-1 md:gap-2 font-bold flex-shrink-0 ${isRecording ? "bg-red-600 animate-pulse" : "bg-white/10"}`}
                        >
                            {isRecording ? <Square fill="currentColor" className="w-3 h-3 md:w-4 md:h-4" /> : <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-600" />}
                            <span className="text-[10px] md:text-sm">{isRecording ? "STOP" : "RECORD"}</span>
                        </Button>
                        <div className="h-8 w-[1px] bg-white/10 mx-1 md:mx-2 flex-shrink-0" />
                        <Button onClick={endCall} className="rounded-full px-6 md:px-8 bg-red-600 hover:bg-red-700 h-10 md:h-12 font-bold flex-shrink-0">
                            <span className="text-[10px] md:text-sm">END</span>
                        </Button>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
