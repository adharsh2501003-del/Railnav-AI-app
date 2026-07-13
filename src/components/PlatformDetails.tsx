import React, { useState } from 'react';
import { 
  Compass, AlertTriangle, MapPin, Eye, Info, Clock, 
  Sparkles, ShieldCheck, Footprints, Flame, HelpCircle 
} from 'lucide-react';

interface PlatformDetailsProps {
  isDarkMode: boolean;
  onStartNavigation: () => void;
}

export default function PlatformDetails({ isDarkMode, onStartNavigation }: PlatformDetailsProps) {
  const [selectedPlat, setSelectedPlat] = useState('5');

  // Sample data for different platforms
  const platformsData: Record<string, {
    trainArriving: string;
    trainNumber: string;
    status: string;
    crowdLevel: 'Low' | 'Medium' | 'Heavy';
    crowdColor: string;
    walkingTime: string;
    nearestLift: string;
    nearestEscalator: string;
    nearestExit: string;
    coaches: { id: string; type: string }[];
    facilities: { name: string; distance: string; description: string }[];
  }> = {
    '5': {
      trainArriving: 'NDLS Shatabdi Express',
      trainNumber: '12002',
      status: 'On Time & arriving in 15 mins',
      crowdLevel: 'Medium',
      crowdColor: 'bg-yellow-500 text-slate-900',
      walkingTime: '3 Minutes',
      nearestLift: 'Glass Elevator Lift B (35m away)',
      nearestEscalator: 'Escalator 2A (50m away)',
      nearestExit: 'Exit Corridor B / Gate A (120m away)',
      coaches: [
        { id: 'ENG', type: 'Engine' },
        { id: 'C1', type: 'AC Chair' },
        { id: 'C2', type: 'AC Chair' },
        { id: 'C3', type: 'AC Chair' },
        { id: 'C4', type: 'AC Chair' },
        { id: 'C5', type: 'AC Chair' },
        { id: 'E1', type: 'Executive' },
        { id: 'E2', type: 'Executive' }
      ],
      facilities: [
        { name: 'RO Drinking Water', distance: '12m away', description: 'Free purified cold water dispenser' },
        { name: 'Restrooms', distance: '22m away', description: 'Gents, Ladies, and Wheelchair-Accessible toilets' },
        { name: 'IRCTC Food Kiosk', distance: '45m away', description: 'Snacks, packaged tea, and light drinks' }
      ]
    },
    '8': {
      trainArriving: 'Kerala Express',
      trainNumber: '12626',
      status: 'Delayed by 25 mins',
      crowdLevel: 'Heavy',
      crowdColor: 'bg-rose-500 text-white',
      walkingTime: '6 Minutes',
      nearestLift: 'Elevator Lift D (90m away)',
      nearestEscalator: 'Escalator 4C (110m away)',
      nearestExit: 'Exit Corridor C / East Gate (180m away)',
      coaches: [
        { id: 'ENG', type: 'Engine' },
        { id: 'S1', type: 'Sleeper' },
        { id: 'S2', type: 'Sleeper' },
        { id: 'S3', type: 'Sleeper' },
        { id: 'B1', type: 'AC 3 Tier' },
        { id: 'B2', type: 'AC 3 Tier' },
        { id: 'A1', type: 'AC 2 Tier' },
        { id: 'H1', type: 'AC 1st Class' }
      ],
      facilities: [
        { name: 'General Waiting Hall', distance: '15m away', description: 'Seating with overhead ceiling fans' },
        { name: 'Water Vending Machine', distance: '30m away', description: 'Automated mineral water dispenser' },
        { name: 'Book Stall', distance: '75m away', description: 'Newspapers, magazines, and maps' }
      ]
    },
    '1': {
      trainArriving: 'Vande Bharat Express',
      trainNumber: '22436',
      status: 'On Time & standing at platform',
      crowdLevel: 'Low',
      crowdColor: 'bg-emerald-green text-white',
      walkingTime: '1 Minute',
      nearestLift: 'Glass Elevator Lift A (15m away)',
      nearestEscalator: 'Escalator 1A (20m away)',
      nearestExit: 'Main Entry Gate A (45m away)',
      coaches: [
        { id: 'ENG', type: 'Engine' },
        { id: 'EC1', type: 'Exec Chair' },
        { id: 'CC1', type: 'AC Chair' },
        { id: 'CC2', type: 'AC Chair' },
        { id: 'CC3', type: 'AC Chair' },
        { id: 'CC4', type: 'AC Chair' }
      ],
      facilities: [
        { name: 'Medical Room clinic', distance: '25m away', description: 'Doctor on duty, first-aid support' },
        { name: 'Police Helpline Desk', distance: '30m away', description: 'RPF assistance and child safety desk' },
        { name: 'IRCTC Food Court', distance: '50m away', description: 'Multi-cuisine seating area' }
      ]
    }
  };

  const activeData = platformsData[selectedPlat] || platformsData['5'];

  return (
    <div
      id="platform-screen-container"
      className={`w-full h-full flex flex-col overflow-y-auto transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Selector Segment */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3 text-left">
          <div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold tracking-wider uppercase block">
              STATION PLATFORM DIRECTORY
            </span>
            <h2 className="text-xl font-bold tracking-tight">Platform {selectedPlat} Details</h2>
          </div>

          <div className="flex gap-1.5 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            {['1', '5', '8'].map(pNum => (
              <button
                key={pNum}
                id={`btn-plat-tab-${pNum}`}
                onClick={() => setSelectedPlat(pNum)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedPlat === pNum 
                    ? 'bg-[#0052CC] text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                P{pNum}
              </button>
            ))}
          </div>
        </div>

        {/* Live Train Arriving Card - Bento layout */}
        <div className="bento-card bg-white dark:bg-slate-900 border-l-4 border-l-[#0052CC] p-5 relative overflow-hidden">
          <div className="absolute right-4 top-4">
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${activeData.crowdColor}`}>
              🟢 {activeData.crowdLevel} Crowd
            </span>
          </div>

          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold block mb-1">
            {activeData.trainNumber} &bull; Arriving Train
          </span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
            {activeData.trainArriving}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            {activeData.status}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Estimated Walk</span>
              <span className="font-bold font-mono text-slate-800 dark:text-white flex items-center gap-1 mt-0.5">
                <Footprints className="w-3.5 h-3.5 text-blue-600" /> {activeData.walkingTime}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Crowd Level</span>
              <span className="font-bold text-slate-800 dark:text-white mt-0.5">
                {activeData.crowdLevel === 'Heavy' ? '🔴 High (Busy)' : activeData.crowdLevel === 'Medium' ? '🟡 Normal' : '🟢 Smooth'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Coach Positions Layout */}
      <div className="px-5 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-left mb-2 flex items-center justify-between">
          <span>Coach Order Layout (Relative to Screen)</span>
          <span className="text-[10px] text-slate-400 lowercase font-normal">(Engine at front)</span>
        </h3>

        <div className="bento-card bg-white dark:bg-slate-900 p-5">
          {/* Animated Train Indicator path */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800 mb-3 no-scrollbar">
            {activeData.coaches.map((coach, index) => (
              <div 
                key={index}
                className="flex-shrink-0 flex flex-col items-center"
              >
                {/* Visual mini train metal block */}
                <div className={`w-11 h-9 rounded-md flex flex-col justify-between p-1 shadow-sm text-[10px] font-mono font-black ${
                  coach.id === 'ENG' 
                    ? 'bg-slate-800 text-white rounded-r-xl' 
                    : coach.type.includes('Exec') || coach.id.startsWith('E')
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                    : 'bg-blue-50 dark:bg-slate-950 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900'
                }`}>
                  <span className="text-[9px] truncate">{coach.id}</span>
                  {/* Wheel dots layout */}
                  <div className="flex justify-between px-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full inline-block"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full inline-block"></span>
                  </div>
                </div>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-1 font-bold truncate max-w-[44px]">
                  {coach.type}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 text-left">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Your coach is calculated near the center. Enter through the main footbridge and proceed left to wait at the appropriate display marker.
            </p>
          </div>
        </div>
      </div>

      {/* Facilities, Exit, Escalator points List */}
      <div className="px-5 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-left mb-2">
          Platform Facilitation & Exits
        </h3>

        <div className="bento-card space-y-3 bg-white dark:bg-slate-900 p-5 text-xs text-left">
          <div className="flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1"></span>
            <div>
              <strong className="text-slate-800 dark:text-slate-200 block">Nearest Wheelchair Elevator</strong>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">{activeData.nearestLift}</p>
            </div>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80 my-1"></div>

          <div className="flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1"></span>
            <div>
              <strong className="text-slate-800 dark:text-slate-200 block">Nearest Station Escalator</strong>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">{activeData.nearestEscalator}</p>
            </div>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80 my-1"></div>

          <div className="flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1"></span>
            <div>
              <strong className="text-slate-800 dark:text-slate-200 block">Nearest Fire / Taxi Exit</strong>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">{activeData.nearestExit}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Services Detail */}
      <div className="px-5 py-2 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-left mb-2">
          Amenities & RO Water Points
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {activeData.facilities.map((fac, i) => (
            <div 
              key={i}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-left flex justify-between items-center"
            >
              <div>
                <strong className="text-xs text-slate-800 dark:text-slate-200">{fac.name}</strong>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">{fac.description}</p>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/40 shrink-0">
                {fac.distance}
              </span>
            </div>
          ))}
        </div>

        {/* Start Navigation Floating action style button */}
        <button
          id="btn-plat-start-navigation"
          onClick={onStartNavigation}
          className="mt-6 w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 cursor-pointer"
        >
          <Compass className="w-4.5 h-4.5" /> Start Live Wayfinding Directions
        </button>
      </div>
    </div>
  );
}
