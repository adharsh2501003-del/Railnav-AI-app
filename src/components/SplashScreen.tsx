import React, { useEffect, useState } from 'react';
import { Compass, Train } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  isDarkMode: boolean;
}

export default function SplashScreen({ onComplete, isDarkMode }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      id="splash-screen-container"
      className={`w-full h-full flex flex-col justify-between items-center p-8 transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top spacing */}
      <div className="h-10"></div>

      {/* Logo & Core Animation Frame */}
      <div className="flex flex-col items-center text-center">
        {/* Animated App Icon Wrapper */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-600 rounded-3xl blur-xl opacity-35 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-lg border-2 border-white/20">
            <Train className="w-12 h-12 text-white animate-bounce" style={{ animationDuration: '3s' }} />
            <Compass className="w-6 h-6 text-emerald-green absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-md border border-slate-200 dark:border-slate-800" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight font-sans">
          RailNav <span className="text-blue-600 dark:text-blue-400">AI</span>
        </h1>
        <p className="text-xs tracking-wider uppercase text-slate-400 dark:text-slate-500 font-semibold mt-1">
          Indian Railways Smart Guide
        </p>

        {/* Tagline */}
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xs mt-6 leading-relaxed">
          "Navigate Every Station with Confidence"
        </p>
      </div>

      {/* Animated Train Track Segment */}
      <div className="w-full flex flex-col items-center px-4">
        {/* Simple train rolling animation */}
        <div className="w-full h-8 relative overflow-hidden mb-2">
          <div 
            className="absolute bottom-0 text-blue-600 dark:text-blue-400 transition-all duration-75"
            style={{ left: `${progress * 0.75}%` }}
          >
            <div className="flex items-center gap-0.5">
              <span className="w-2.5 h-1.5 bg-emerald-green rounded-t-sm inline-block"></span>
              <span className="w-6 h-4 bg-blue-600 dark:bg-blue-500 rounded-t-md rounded-r-lg inline-block flex items-center justify-center">
                <span className="w-1 h-1 bg-white rounded-full ml-2"></span>
              </span>
            </div>
          </div>
          {/* Track line */}
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-300 dark:bg-slate-800 flex justify-between">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="w-0.5 h-1 bg-slate-400 dark:bg-slate-700 -translate-y-0.5"></span>
            ))}
          </div>
        </div>

        {/* Loading status */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between w-full mt-2 text-[10px] font-mono text-slate-400">
          <span>SYSTEM LOADING...</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
