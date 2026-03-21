import React from "react";
import Videogrid from "@/components/Videogrid";
import { PlaySquare } from "lucide-react";
import { useUser } from "@/lib/AuthContext";

export default function SubscriptionsPage() {
  const { user } = useUser() as any;

  if (!user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <PlaySquare className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Don&apos;t miss new videos</h2>
        <p className="text-muted-foreground text-center">Sign in to see updates from your favorite YouTube channels</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <PlaySquare className="w-8 h-8 text-red-600" />
        <h1 className="text-2xl font-bold">Your Subscriptions</h1>
      </div>
      <Videogrid uploaderFilters={user.subscriptions || []} />
    </main>
  );
}
