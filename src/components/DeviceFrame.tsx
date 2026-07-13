import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, Battery, Signal, Layers, ChevronRight, Settings, Info } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
  activeScreen: string;
  setScreen: (screen: string) => void;
  screensList: { id: string; name: string; icon: string }[];
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}

export default function DeviceFrame({
  children,
  activeScreen,
  setScreen,
  screensList,
  isDarkMode,
  setIsDarkMode,
}: DeviceFrameProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-6 px-4 flex items-center justify-center font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Premium Background Ambient Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Physical Device Wrapper (Phone Bezel) */}
      <div className="relative z-10 transition-transform duration-500 hover:scale-[1.002]">
        {/* Speaker Speaker & Front Camera Notch */}
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-40 h-6 bg-black rounded-full z-40 flex items-center justify-between px-4">
          <div className="w-12 h-1 bg-neutral-800 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full border border-neutral-800"></div>
        </div>

        {/* Outer Bezel Chassis */}
        <div className="w-[390px] h-[820px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col select-none">
          {/* Inner Display Screen */}
          <div className="w-full h-full rounded-[38px] bg-white overflow-hidden relative flex flex-col border border-neutral-950">
            {/* Native Mobile Status Bar */}
            <div className={`h-11 px-6 pt-3 flex items-center justify-between text-xs z-30 transition-colors duration-200 font-medium select-none ${
              isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
            }`}>
              {/* Local Clock */}
              <div id="status-bar-clock" className="font-mono text-[11px] tracking-wide">{time}</div>
              
              {/* Device Icons */}
              <div className="flex items-center gap-1.5">
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] font-semibold">94%</span>
                  <Battery className="w-4 h-4 rotate-0" />
                </div>
              </div>
            </div>

            {/* Device Screen Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {children}
            </div>

            {/* Home Indicator Bar */}
            <div className={`h-6 flex items-center justify-center z-30 transition-colors duration-200 ${
              isDarkMode ? 'bg-slate-950' : 'bg-white'
            }`}>
              <div className={`w-32 h-1 rounded-full ${
                isDarkMode ? 'bg-neutral-800' : 'bg-neutral-300'
              }`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
