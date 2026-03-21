import { Bell, Menu, Mic, Search, User, VideoIcon, ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Channeldialogue from "./channeldialogue";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";
import OTPModal from "./OTPModal";
import axiosInstance from "@/lib/axiosinstance";
import { useEffect } from "react";

const Header = () => {
  const { user, login, logout } = useUser() as any;
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
        try {
            await axiosInstance.get("/video/getall");
            setIsBackendConnected(true);
        } catch (err) {
            setIsBackendConnected(false);
        }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  // const user: any = {
  //   id: "1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   image: "https://github.com/shadcn.png?height=32&width=32",
  // };
  const [searchQuery, setSearchQuery] = useState("");
  const [isdialogeopen, setisdialogeopen] = useState(false);
  const router = useRouter();
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const handleKeypress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };
  if (showMobileSearch) {
    return (
      <header className="flex items-center w-full px-2 py-2 bg-background border-b transition-colors duration-500 h-[60px]">
        <Button variant="ghost" size="icon" onClick={() => setShowMobileSearch(false)} className="mr-2 flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <form onSubmit={handleSearch} className="flex flex-1 items-center bg-secondary rounded-full border border-border overflow-hidden">
          <Input
            type="search"
            placeholder="Search YourTube"
            value={searchQuery}
            onKeyPress={handleKeypress}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-foreground px-4 h-10"
            autoFocus
          />
          <Button type="submit" variant="ghost" className="rounded-r-full px-4 h-10 hover:bg-transparent">
            <Search className="w-5 h-5" />
          </Button>
        </form>
        <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0 ml-2 bg-secondary hidden sm:flex">
          <Mic className="w-5 h-5" />
        </Button>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between px-2 sm:px-4 py-2 bg-background border-b transition-colors duration-500 h-[60px]">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Menu className="w-6 h-6" />
        </Button>
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-red-600 p-1 rounded">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span className="text-xl font-medium tracking-tighter">YourTube</span>
          <div className="flex flex-col">
            <span className="text-[10px] leading-none text-gray-400">IN</span>
            <div 
                className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isBackendConnected === true ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : isBackendConnected === false ? "bg-red-500 animate-pulse" : "bg-yellow-500"}`} 
                title={isBackendConnected === true ? "Backend Connected" : isBackendConnected === false ? "Backend Offline / Blocked" : "Checking..."}
            />
          </div>
        </Link>

      </div>
      <form
        onSubmit={handleSearch}
        className="hidden sm:flex items-center gap-2 flex-1 max-w-2xl mx-4"
      >
        <div className="flex flex-1">
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onKeyPress={handleKeypress}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-l-full border-r-0 focus-visible:ring-0 bg-background text-foreground"
          />
          <Button
            type="submit"
            className="rounded-r-full px-6 bg-secondary hover:bg-secondary/80 text-foreground border border-l-0"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
          <Mic className="w-5 h-5" />
        </Button>
      </form>
      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setShowMobileSearch(true)}>
          <Search className="w-5 h-5" />
        </Button>
        {user ? (
          <>
            <Button variant="ghost" size="icon">
              <VideoIcon className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-6 h-6" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {user?.channelname ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/channel/${user?._id}`}>Your channel</Link>
                  </DropdownMenuItem>
                ) : (
                  <div className="px-2 py-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setisdialogeopen(true)}
                    >
                      Create Channel
                    </Button>
                  </div>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/history">History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/liked">Liked videos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/watch-later">Watch later</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button
              className="flex items-center gap-2"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <User className="w-4 h-4" />
              Sign in
            </Button>
          </>
        )}{" "}
      </div>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
      <OTPModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
};

export default Header;
