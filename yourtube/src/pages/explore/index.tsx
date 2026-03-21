import React from "react";
import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";
import { Compass } from "lucide-react";

export default function ExplorePage() {
  return (
    <main className="flex-1 p-4 md:p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <Compass className="w-8 h-8 text-red-600" />
        <h1 className="text-2xl font-bold">Explore Trending Content</h1>
      </div>
      <CategoryTabs />
      <Videogrid />
    </main>
  );
}
