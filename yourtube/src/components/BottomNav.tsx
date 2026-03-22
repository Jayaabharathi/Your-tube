import Link from 'next/link';
import { Home, Compass, PlaySquare, User, Video } from 'lucide-react';
import { useUser } from '@/lib/AuthContext';
import { useState } from 'react';
import Channeldialogue from './channeldialogue';

const BottomNav = () => {
  const { user } = useUser() as any;
  const [isdialogeopen, setisdialogeopen] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around items-center h-14 z-50 transition-colors duration-500 pb-safe">
        <Link href="/" className="flex flex-col items-center gap-1 text-muted-foreground w-16 hover:text-foreground">
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>
        <Link href="/explore" className="flex flex-col items-center gap-1 text-muted-foreground w-16 hover:text-foreground">
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">Explore</span>
        </Link>
        <Link href="/subscriptions" className="flex flex-col items-center gap-1 text-muted-foreground w-16 hover:text-foreground">
          <PlaySquare className="w-5 h-5" />
          <span className="text-[10px]">Subs</span>
        </Link>
        <Link href="/videocall" className="flex flex-col items-center gap-1 text-red-500 w-16 hover:text-red-400 font-medium">
          <Video className="w-5 h-5" />
          <span className="text-[10px]">VoIP</span>
        </Link>
        
        {user?.channelname ? (
          <Link href={`/channel/${user._id}`} className="flex flex-col items-center gap-1 text-muted-foreground w-16 hover:text-foreground">
            <User className="w-5 h-5" />
            <span className="text-[10px]">You</span>
          </Link>
        ) : (
          <button onClick={() => setisdialogeopen(true)} className="flex flex-col items-center gap-1 text-muted-foreground w-16 hover:text-foreground">
            <User className="w-5 h-5" />
            <span className="text-[10px]">You</span>
          </button>
        )}
      </nav>
      <Channeldialogue isopen={isdialogeopen} onclose={() => setisdialogeopen(false)} mode="create" />
    </>
  );
};

export default BottomNav;
