"use client"; // Add this to use client-side hooks
import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-lg">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse">
          <Rocket className="text-blue-500 w-16 h-16 animate-bounce" />
        </div>

        <p className="text-white text-2xl font-bold tracking-wider bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Loading...
        </p>

        <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-sm text-gray-400">{progress}%</p>
      </div>
    </div>
  );
}