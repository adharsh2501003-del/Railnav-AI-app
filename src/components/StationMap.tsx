import React, { useState, useEffect } from 'react';
import { 
  MapPin, Layers, Compass, ZoomIn, ZoomOut, ArrowRight, Eye, 
  EyeOff, RefreshCw, Sparkles, Navigation, AlertCircle, CheckCircle
} from 'lucide-react';
import { STATION_DESTINATIONS } from '../data';

interface StationMapProps {
  isDarkMode: boolean;
  preselectedFilter?: string;
  preselectedRoute?: boolean;
  onStartNavigation: () => void;
  preselectedDestination?: {
    label: string;
    x: number;
    y: number;
    details: string;
    floor: string;
  } | null;
}

export default function StationMap({
  isDarkMode,
  preselectedFilter = '',
  preselectedRoute = false,
  onStartNavigation,
  preselectedDestination = null,
}: StationMapProps) {
  const [currentFloor, setCurrentFloor] = useState('GF'); // 'GF' | 'FF' | 'SF'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedLayers, setSelectedLayers] = useState<string[]>(
    preselectedFilter ? [preselectedFilter] : ['platforms', 'restrooms', 'food']
  );
  const [showCrowdHeatmap, setShowCrowdHeatmap] = useState(false);
  const [navigationActive, setNavigationActive] = useState(preselectedRoute);
  const [mapCenter, setMapCenter] = useState({ x: 0, y: 0 });

  // Currently selected starting position for dynamic routing
  const [startLocation, setStartLocation] = useState<{
    label: string;
    x: number;
    y: number;
    details: string;
    floor: string;
  }>({
    label: 'Ticket Counter North',
    x: 60,
    y: 260,
    details: '8 windows open',
    floor: 'GF'
  });

  // Currently selected wayfinding target destination
  const [selectedDestination, setSelectedDestination] = useState<{
    label: string;
    x: number;
    y: number;
    details: string;
    floor: string;
  }>({
    label: 'Platform 5',
    x: 260,
    y: 120,
    details: 'NDLS Shatabdi Exp arriving',
    floor: 'GF'
  });

  // Navigation simulation parameters
  const [navProgress, setNavProgress] = useState(0);
  const [navPlaying, setNavPlaying] = useState(true);
  const [bottomSheetMinimized, setBottomSheetMinimized] = useState(false);

  // Unique and dynamic wayfinding route generator with exactly 3 intermediate checkpoints
  const getPathPoints = () => {
    const S = startLocation;
    const D = selectedDestination;

    if (S.label === D.label) {
      return [
        { x: S.x, y: S.y, floor: S.floor, label: `Start (${S.label})` },
        { x: S.x, y: S.y, floor: S.floor, label: 'Checkpoint 1' },
        { x: S.x, y: S.y, floor: S.floor, label: 'Checkpoint 2' },
        { x: S.x, y: S.y, floor: S.floor, label: 'Checkpoint 3' },
        { x: S.x, y: S.y, floor: S.floor, label: `Arrived (${D.label})` }
      ];
    }

    if (S.floor === D.floor) {
      const floor = S.floor;
      let mainY = 220;
      if (floor === 'FF') mainY = 180;
      if (floor === 'SF') mainY = 200;

      const c1X = S.x;
      const c1Y = mainY;
      const c1Label = `Exit Corridor near ${S.label}`;

      const c2X = Math.round((S.x + D.x) / 2);
      const c2Y = mainY;
      let c2Label = `${floor} Central Concourse`;
      if (floor === 'GF') {
        if (c2X > 200) c2Label = 'GF East Junction';
        else if (c2X < 120) c2Label = 'GF West Junction';
        else c2Label = 'GF Main Concourse Crossing';
      } else if (floor === 'FF') {
        c2Label = 'FF Mezzanine Walkway';
      } else if (floor === 'SF') {
        c2Label = 'SF Command Foyer';
      }

      const c3X = D.x;
      const c3Y = mainY;
      const c3Label = `Approach Corridor near ${D.label}`;

      return [
        { x: S.x, y: S.y, floor: floor, label: `Start (${S.label})` },
        { x: c1X, y: c1Y, floor: floor, label: c1Label },
        { x: c2X, y: c2Y, floor: floor, label: c2Label },
        { x: c3X, y: c3Y, floor: floor, label: c3Label },
        { x: D.x, y: D.y, floor: floor, label: D.label }
      ];
    } else {
      const transX = 210;
      const transY = 160;
      const transName = 'Glass Lift A';

      const c1X = S.x;
      const c1Y = transY;
      const c1Label = `Exit Lobby near ${S.label}`;

      const c2X = transX;
      const c2Y = transY;
      const c2Label = `${transName} Boarding (${S.floor})`;

      const c3X = transX;
      const c3Y = transY;
      const c3Label = `${transName} Landing (${D.floor})`;

      return [
        { x: S.x, y: S.y, floor: S.floor, label: `Start (${S.label})` },
        { x: c1X, y: c1Y, floor: S.floor, label: c1Label },
        { x: c2X, y: c2Y, floor: S.floor, label: c2Label },
        { x: c3X, y: c3Y, floor: D.floor, label: c3Label },
        { x: D.x, y: D.y, floor: D.floor, label: D.label }
      ];
    }
  };

  const getSimulatedUserPosition = (progress: number) => {
    const points = getPathPoints();
    let activePointIndex = 0;
    let segmentProgress = 0;

    if (progress <= 25) {
      activePointIndex = 0;
      segmentProgress = progress / 25;
    } else if (progress <= 50) {
      activePointIndex = 1;
      segmentProgress = (progress - 25) / 25;
    } else if (progress <= 75) {
      activePointIndex = 2;
      segmentProgress = (progress - 50) / 25;
    } else {
      activePointIndex = 3;
      segmentProgress = Math.min(1, (progress - 75) / 25);
    }

    const p1 = points[activePointIndex];
    const p2 = points[activePointIndex + 1];

    const userFloor = segmentProgress < 0.5 ? p1.floor : p2.floor;

    return {
      x: p1.x + (p2.x - p1.x) * segmentProgress,
      y: p1.y + (p2.y - p1.y) * segmentProgress,
      floor: userFloor
    };
  };

  const userPos = navigationActive ? getSimulatedUserPosition(navProgress) : { x: startLocation.x, y: startLocation.y, floor: startLocation.floor };

  // Capture current passenger position dynamically
  const getCurrentPassengerPosition = () => {
    if (navProgress >= 98) {
      return selectedDestination;
    }
    const pos = getSimulatedUserPosition(navProgress);
    const matched = STATION_DESTINATIONS.find(d => {
      if (d.floor !== pos.floor) return false;
      const dx = d.x - pos.x;
      const dy = d.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });
    if (matched) {
      return {
        label: matched.label,
        x: matched.x,
        y: matched.y,
        details: matched.details,
        floor: matched.floor
      };
    }
    return {
      label: 'Your Current Position',
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      details: 'Current passenger position',
      floor: pos.floor
    };
  };

  // Select new wayfinding destination starting from the passenger's actual current location
  const handleSelectNewDestination = (newDest: typeof selectedDestination) => {
    const passengerLoc = getCurrentPassengerPosition();
    setStartLocation(passengerLoc);
    setSelectedDestination(newDest);
    setCurrentFloor(passengerLoc.floor);
    setNavigationActive(false);
    setNavProgress(0);
    setNavPlaying(true);
  };

  // Auto trigger minimization if starting navigation with a preselected route or synced destination
  useEffect(() => {
    if (preselectedDestination) {
      const passengerLoc = getCurrentPassengerPosition();
      setStartLocation(passengerLoc);
      setSelectedDestination(preselectedDestination);
      setCurrentFloor(passengerLoc.floor);
      setNavigationActive(preselectedRoute);
      setNavProgress(0);
      setNavPlaying(true);
      if (preselectedRoute) {
        setBottomSheetMinimized(true);
      } else {
        setBottomSheetMinimized(false);
      }
    } else if (preselectedRoute) {
      setNavigationActive(true);
      setBottomSheetMinimized(true);
    }
  }, [preselectedDestination, preselectedRoute]);

  // Turn-by-turn simulation loop - halts precisely when reaching 100%
  useEffect(() => {
    let timer: any;
    if (navigationActive && navPlaying) {
      timer = setInterval(() => {
        setNavProgress(prev => {
          if (prev >= 100) {
            setNavPlaying(false); // Stop simulation play state at destination
            setStartLocation(selectedDestination);
            return 100; // Stop precisely at reached location
          }
          return prev + 1; // 1% increment
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [navigationActive, navPlaying, selectedDestination]);

  // Synchronize current map floor with simulated user position floor
  useEffect(() => {
    if (navigationActive) {
      const pos = getSimulatedUserPosition(navProgress);
      if (pos.floor !== currentFloor) {
        setCurrentFloor(pos.floor);
      }
    }
  }, [navProgress, navigationActive]);

  // Construct SVG path string for segments located strictly on the specified floor
  const getSVGPathD = (floor: string) => {
    const points = getPathPoints();
    let d = '';
    let inFloor = false;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (pt.floor === floor) {
        if (!inFloor) {
          d += `M ${pt.x},${pt.y}`;
          inFloor = true;
        } else {
          d += ` L ${pt.x},${pt.y}`;
        }
      } else {
        inFloor = false;
      }
    }
    return d;
  };

  // Dynamically calculate actual pathway distance in scaled meters
  const getRouteDistance = () => {
    const points = getPathPoints();
    let distPx = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (p1.floor !== p2.floor) {
        distPx += 40; // Floor transition virtual distance (approx. 40m)
      } else {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        distPx += Math.sqrt(dx * dx + dy * dy);
      }
    }
    return Math.max(10, Math.round(distPx * 1.1)); // Scaled meters
  };

  // HUD directions mapping based on navigation progress percentage and dynamically requested landmarks
  const getNavigationInstruction = (progress: number) => {
    const points = getPathPoints();
    const S = startLocation;
    const D = selectedDestination;

    if (progress >= 100) {
      return {
        text: `Arrived at ${D.label}!`,
        sub: `${D.details} • Wayfinding Completed`,
        icon: (
          <svg className="w-5 h-5 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )
      };
    } else if (progress >= 75) {
      return {
        text: `Proceed right to ${D.label}`,
        sub: `Almost there • ${Math.round((100 - progress) * 1.5)} meters remaining`,
        icon: (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        )
      };
    } else if (progress >= 50) {
      if (S.floor !== D.floor) {
        return {
          text: `Take Elevator to ${D.floor}`,
          sub: `Exiting at ${points[3].label}`,
          icon: (
            <svg className="w-5 h-5 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )
        };
      }
      return {
        text: `Turn at ${points[2].label}`,
        sub: `Heading along the station corridor concourse`,
        icon: (
          <svg className="w-5 h-5 text-white -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        )
      };
    } else if (progress >= 25) {
      return {
        text: `Walk straight past ${points[1].label}`,
        sub: `Flat corridor walk • ${Math.round((100 - progress) * 1.8)}m to go`,
        icon: (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        )
      };
    } else {
      return {
        text: `Departing from ${S.label}`,
        sub: `Following smart path to ${D.label}`,
        icon: (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )
      };
    }
  };

  const navInstruction = getNavigationInstruction(navProgress);

  const layerOptions = [
    { id: 'platforms', label: 'Platforms', color: 'border-blue-500 text-blue-600 bg-blue-50/45 dark:bg-blue-950/20' },
    { id: 'restrooms', label: 'Restrooms', color: 'border-indigo-500 text-indigo-600 bg-indigo-50/45 dark:bg-indigo-950/20' },
    { id: 'food', label: 'Food & Dining', color: 'border-emerald-500 text-emerald-green bg-emerald-50/45 dark:bg-emerald-950/20' },
    { id: 'waiting', label: 'Waiting Areas', color: 'border-purple-500 text-purple-600 bg-purple-50/45 dark:bg-purple-950/20' },
    { id: 'elevators', label: 'Lifts/Elevators', color: 'border-teal-500 text-teal-600 bg-teal-50/45 dark:bg-teal-950/20' },
    { id: 'escalators', label: 'Escalators', color: 'border-amber-500 text-amber-600 bg-amber-50/45 dark:bg-amber-950/20' },
    { id: 'water', label: 'Drinking Water', color: 'border-cyan-500 text-cyan-600 bg-cyan-50/45 dark:bg-cyan-950/20' },
    { id: 'atms', label: 'ATMs', color: 'border-pink-500 text-pink-600 bg-pink-50/45 dark:bg-pink-950/20' },
    { id: 'charging', label: 'Charging Stn', color: 'border-yellow-500 text-yellow-600 bg-yellow-50/45 dark:bg-yellow-950/20' }
  ];

  const toggleLayer = (layerId: string) => {
    setSelectedLayers(prev => 
      prev.includes(layerId) ? prev.filter(l => l !== layerId) : [...prev, layerId]
    );
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));

  // Custom station map coordinates for elements depending on floor
  const mapMarkers: Record<string, { x: number; y: number; label: string; type: string; details: string; crowd: 'Low' | 'Medium' | 'Heavy' }[]> = {
    GF: [
      { x: 260, y: 120, label: 'Platform 5', type: 'platforms', details: 'NDLS Shatabdi Exp arriving', crowd: 'Medium' },
      { x: 100, y: 120, label: 'Platform 4', type: 'platforms', details: 'Rajdhani Exp Departing', crowd: 'Low' },
      { x: 180, y: 220, label: 'Restroom Block A', type: 'restrooms', details: 'Clean toilets, Disabled-friendly', crowd: 'Low' },
      { x: 60, y: 260, label: 'Ticket Counter North', type: 'waiting', details: '8 windows open', crowd: 'Heavy' },
      { x: 210, y: 160, label: 'Glass Lift A', type: 'elevators', details: 'Wheelchair access, Level GF to FF', crowd: 'Low' },
      { x: 310, y: 240, label: 'State Bank ATM', type: 'atms', details: 'Cash Available', crowd: 'Low' },
      { x: 150, y: 320, label: 'General Waiting Room', type: 'waiting', details: 'AC waiting facilities, 200 seats', crowd: 'Medium' },
    ],
    FF: [
      { x: 120, y: 160, label: 'IRCTC Food Court', type: 'food', details: 'Dominos, Haldirams, Coffee Kiosks', crowd: 'Heavy' },
      { x: 220, y: 220, label: 'Executive VIP Lounge', type: 'waiting', details: 'Sofa seating, refreshments', crowd: 'Low' },
      { x: 300, y: 140, label: 'Charging Point Station B', type: 'charging', details: '6 USB power docks, multi-pin', crowd: 'Medium' },
      { x: 80, y: 100, label: 'Platform 6 Stairs', type: 'escalators', details: 'Stairs & Escalator down', crowd: 'Heavy' },
      { x: 160, y: 280, label: 'Water Purifier Station', type: 'water', details: 'Free cold RO water', crowd: 'Medium' }
    ],
    SF: [
      { x: 150, y: 150, label: 'Railway Police Office', type: 'waiting', details: 'RPF Booth, Help 24/7', crowd: 'Low' },
      { x: 250, y: 200, label: 'Resting Dormitories', type: 'waiting', details: 'AC & Non-AC sleeping berths', crowd: 'Low' },
      { x: 100, y: 240, label: 'Lost & Found Center', type: 'waiting', details: 'Claim missing baggage here', crowd: 'Low' }
    ]
  };

  const activeMarkers = mapMarkers[currentFloor] || [];

  return (
    <div
      id="map-screen-container"
      className={`w-full h-full flex flex-col relative overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Self-contained styling for Google Maps route line animation & HUD entry transitions */}
      <style>{`
        @keyframes mapsDash {
          to {
            stroke-dashoffset: -16;
          }
        }
        .animate-maps-dash {
          animation: mapsDash 0.8s linear infinite;
        }
        @keyframes slideDown {
          from {
            transform: translateY(-30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Google Maps Style Navigation Guidance HUD (Top overlay) */}
      {navigationActive ? (
        <div className="absolute top-4 left-4 right-4 z-30 bg-emerald-600 dark:bg-emerald-700 text-white rounded-2xl p-3.5 shadow-xl flex items-center gap-3 border border-emerald-500/30 animate-slideDown">
          {/* Instruction Turn Direction Icon */}
          <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-inner">
            {navInstruction.icon}
          </div>
          <div className="flex-1 text-left min-w-0">
            <h4 className="text-[10px] font-black tracking-widest truncate uppercase text-emerald-100">
              {navProgress >= 100 ? 'ARRIVED' : `In ${Math.max(10, 180 - Math.round(navProgress * 1.8))} meters`}
            </h4>
            <p className="text-xs font-bold leading-tight truncate">
              {navInstruction.text}
            </p>
            <p className="text-[9px] text-emerald-200/90 font-medium truncate mt-0.5">
              {navInstruction.sub}
            </p>
          </div>
          {/* Real-time walkthrough progress badge */}
          <div className="shrink-0 flex flex-col items-end">
            <span className="text-[9px] font-mono font-extrabold tracking-wider bg-emerald-800/80 px-2 py-1 rounded-lg border border-emerald-600/50">
              {Math.round(navProgress)}%
            </span>
          </div>
        </div>
      ) : (
        /* Standard Search Overlay Input (Visible when navigation is inactive) */
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-2">
          <div className="flex-1 h-11 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 flex items-center gap-2.5 shadow-md">
            <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 animate-pulse" />
            <span className="text-xs font-semibold truncate dark:text-white">
              New Delhi Station Complex
            </span>
            <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono text-slate-500 font-bold">
              GPS: Live
            </span>
          </div>

          {/* Crowd Heatmap Toggle Button */}
          <button
            id="btn-map-crowd"
            onClick={() => setShowCrowdHeatmap(prev => !prev)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-md transition ${
              showCrowdHeatmap 
                ? 'bg-rose-500 text-white border-rose-500 animate-pulse' 
                : 'bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
            title="Toggle Crowd Heatmap"
          >
            <Sparkles className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Floating Floor Selector */}
      <div className={`absolute right-4 z-20 flex flex-col gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-1 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 transition-all duration-300 ${
        navigationActive ? 'top-[92px]' : 'top-20'
      }`}>
        {['SF', 'FF', 'GF'].map(floor => (
          <button
            key={floor}
            id={`btn-floor-${floor}`}
            onClick={() => {
              setCurrentFloor(floor);
              setNavigationActive(false); // Reset route demonstration for other floors
              setBottomSheetMinimized(false);
            }}
            className={`w-9 h-9 rounded-lg text-xs font-extrabold flex items-center justify-center transition ${
              currentFloor === floor 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {floor}
          </button>
        ))}
      </div>

      {/* Floating Zoom and Navigation Reset Tools */}
      <div className={`absolute left-4 z-20 flex flex-col gap-1.5 transition-all duration-300 ${
        bottomSheetMinimized ? 'bottom-[100px]' : 'bottom-[296px]'
      }`}>
        <button
          id="btn-map-zoomin"
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md text-slate-700 dark:text-slate-300 active:scale-95 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-map-zoomout"
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md text-slate-700 dark:text-slate-300 active:scale-95 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        {navigationActive && (
          <button
            id="btn-map-recenter"
            onClick={() => {
              setZoomLevel(1.1);
              setMapCenter({ x: 0, y: 0 });
            }}
            className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-800 flex items-center justify-center shadow-md text-blue-600 dark:text-blue-400 active:scale-95 transition"
            title="Recenter Map view"
          >
            <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
          </button>
        )}
      </div>

      {/* Interactive Layer Filter horizontal bar (Shifted down slightly during active navigation to avoid HUD conflict) */}
      <div className={`absolute left-4 right-16 z-15 flex gap-1.5 overflow-x-auto pb-1 pr-4 no-scrollbar transition-all duration-300 ${
        navigationActive ? 'top-[92px]' : 'top-[72px]'
      }`}>
        {layerOptions.map(layer => {
          const isActive = selectedLayers.includes(layer.id);
          return (
            <button
              key={layer.id}
              id={`btn-layer-filter-${layer.id}`}
              onClick={() => toggleLayer(layer.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border shrink-0 transition-all duration-150 ${
                isActive 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm scale-102' 
                  : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {layer.label}
            </button>
          );
        })}
      </div>

      {/* Map Drawing Canvas Area */}
      <div 
        className="flex-1 w-full relative overflow-hidden flex items-center justify-center"
        style={{ cursor: 'grab' }}
      >
        {/* Render Vector Map Base layout inside SVG */}
        <div 
          className="w-[360px] h-[480px] bg-white dark:bg-slate-900 rounded-3xl relative shadow-inner overflow-hidden border border-slate-200 dark:border-slate-800"
          style={{
            transform: `scale(${zoomLevel}) translate(${mapCenter.x}px, ${mapCenter.y}px)`,
            transition: 'transform 0.25s cubic-bezier(0.1, 0.8, 0.2, 1)'
          }}
        >
          {/* Grid lines in background for architecture feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>

          {/* SVG Map Layout Lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 480" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outline structural layout of Station Rooms depending on Floor */}
            {currentFloor === 'GF' && (
              <>
                {/* Station Walls */}
                <rect x="20" y="40" width="320" height="400" rx="16" className="stroke-slate-300 dark:stroke-slate-700 stroke-2 fill-none" />
                {/* Platform lines */}
                <line x1="20" y1="100" x2="340" y2="100" className="stroke-slate-400 dark:stroke-slate-600 stroke-[6]" />
                <line x1="20" y1="140" x2="340" y2="140" className="stroke-slate-400 dark:stroke-slate-600 stroke-[6]" />
                {/* Platform tracks labels */}
                <text x="30" y="94" className="fill-slate-400 dark:fill-slate-500 font-mono text-[9px] font-bold">TRACK 5 - PLATFORM 5</text>
                <text x="30" y="154" className="fill-slate-400 dark:fill-slate-500 font-mono text-[9px] font-bold">TRACK 4 - PLATFORM 4</text>

                {/* Rooms */}
                <rect x="40" y="180" width="100" height="80" rx="8" className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5] fill-slate-50 dark:fill-slate-950" />
                <text x="50" y="200" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-bold">TICKET COUNTER</text>

                <rect x="40" y="280" width="130" height="120" rx="8" className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5] fill-slate-50 dark:fill-slate-950" />
                <text x="50" y="300" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-bold">WAITING LOUNGE</text>

                <rect x="220" y="280" width="100" height="120" rx="8" className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5] fill-slate-50 dark:fill-slate-950" />
                <text x="230" y="300" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-bold">ADMIN OFFICE</text>

              </>
            )}

            {currentFloor === 'FF' && (
              <>
                <rect x="20" y="40" width="320" height="400" rx="16" className="stroke-indigo-300/60 dark:stroke-slate-700 stroke-2 fill-none" />
                {/* Platforms lines for FF */}
                <line x1="20" y1="80" x2="340" y2="80" className="stroke-slate-400 dark:stroke-slate-600 stroke-[6]" />
                <text x="30" y="74" className="fill-slate-400 dark:fill-slate-500 font-mono text-[9px] font-bold">PLATFORM 6 & 7</text>

                {/* Rooms */}
                <rect x="40" y="120" width="160" height="100" rx="10" className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5] fill-slate-50 dark:fill-slate-950" />
                <text x="50" y="140" className="fill-emerald-600 dark:fill-emerald-400 text-[11px] font-extrabold">IRCTC FOOD COURT</text>

                <rect x="220" y="120" width="100" height="150" rx="10" className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5] fill-slate-50 dark:fill-slate-950" />
                <text x="230" y="140" className="fill-purple-600 dark:fill-purple-400 text-[10px] font-extrabold">VIP DORMITORY</text>
              </>
            )}

            {currentFloor === 'SF' && (
              <>
                <rect x="20" y="40" width="320" height="400" rx="16" className="stroke-purple-300/50 dark:stroke-slate-700 stroke-2 fill-none" />
                <rect x="50" y="100" width="260" height="180" rx="12" className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5] fill-slate-50 dark:fill-slate-950" />
                <text x="65" y="125" className="fill-slate-500 dark:fill-slate-400 text-xs font-bold">POLICE & ADMINISTRATIVE COMMAND</text>
              </>
            )}

            {/* DYNAMIC HIGH FIDELITY PATHWAY OVERLAY (WORKS ON ANY FLOOR) */}
            {navigationActive && (() => {
              const d = getSVGPathD(currentFloor);
              if (!d) return null;
              return (
                <>
                  {/* Glow outline layer */}
                  <path 
                    d={d} 
                    className="stroke-blue-400/25 dark:stroke-blue-500/20 stroke-[10px] stroke-linecap-round stroke-linejoin-round fill-none"
                  />
                  {/* Main Solid Google Maps Neon Route Line */}
                  <path 
                    d={d} 
                    className="stroke-blue-600 dark:stroke-blue-500 stroke-[5px] stroke-linecap-round stroke-linejoin-round fill-none"
                  />
                  {/* Google Maps Animated Dash Direction Indicators */}
                  <path 
                    d={d} 
                    className="stroke-white stroke-[2px] stroke-linecap-round stroke-linejoin-round stroke-dasharray-[6,8] animate-maps-dash fill-none"
                  />

                  {/* Checkpoint Node Indicators */}
                  {getPathPoints().map((pt, idx) => {
                    if (pt.floor !== currentFloor) return null;
                    const isReached = navProgress >= (idx * 25);
                    const isCurrent = navProgress >= ((idx - 1) * 25) && navProgress < (idx * 25);
                    return (
                      <g key={idx}>
                        {isCurrent && (
                          <circle cx={pt.x} cy={pt.y} r="8" className="fill-blue-500/30 animate-pulse" />
                        )}
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r="5.5" 
                          className={`transition-all duration-300 stroke-white stroke-1.5 ${
                            isReached ? 'fill-emerald-500' : 'fill-slate-400'
                          }`} 
                        />
                      </g>
                    );
                  })}

                  {/* End Destination Pulse Signal */}
                  {selectedDestination.floor === currentFloor && (
                    <>
                      <circle cx={selectedDestination.x} cy={selectedDestination.y} r="10" className="fill-rose-500/30 stroke-none animate-ping" style={{ animationDuration: '2s' }} />
                      <circle cx={selectedDestination.x} cy={selectedDestination.y} r="5" className="fill-rose-600 stroke-white stroke-1.5" />
                    </>
                  )}
                </>
              );
            })()}
          </svg>

          {/* Crowd Heatmap Layer Overlays (Colored circles) */}
          {showCrowdHeatmap && (
            <div className="absolute inset-0 pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-45">
              {/* Heavy crowd zones (Red) */}
              <div className="absolute top-[200px] left-[50px] w-28 h-28 bg-red-500 rounded-full blur-xl"></div>
              <div className="absolute top-[80px] left-[200px] w-14 h-14 bg-red-500 rounded-full blur-lg"></div>
              {/* Medium crowd zones (Yellow) */}
              <div className="absolute top-[260px] left-[130px] w-24 h-24 bg-yellow-500 rounded-full blur-xl"></div>
              <div className="absolute top-[100px] left-[40px] w-16 h-16 bg-yellow-500 rounded-full blur-lg"></div>
              {/* Low crowd zones (Green) */}
              <div className="absolute top-[320px] left-[200px] w-32 h-32 bg-emerald-500 rounded-full blur-2xl"></div>
            </div>
          )}

          {/* Draw Map Markers & Pins */}
          {activeMarkers.map((marker, i) => {
            const isLayerEnabled = selectedLayers.includes(marker.type);
            if (!isLayerEnabled) return null;

            const isCurrentTarget = selectedDestination.label === marker.label;

            let iconColor = isCurrentTarget ? 'bg-rose-600 text-white scale-125' : 'bg-blue-600 text-white';
            if (!isCurrentTarget) {
              if (marker.type === 'restrooms') iconColor = 'bg-indigo-600 text-white';
              if (marker.type === 'food') iconColor = 'bg-emerald-600 text-white';
              if (marker.type === 'elevators') iconColor = 'bg-teal-600 text-white';
              if (marker.type === 'atms') iconColor = 'bg-pink-600 text-white';
            }

            return (
              <div 
                key={i}
                className="absolute z-10"
                style={{ left: `${marker.x}px`, top: `${marker.y}px` }}
              >
                {/* Floating Map popup Navigate Button */}
                {isCurrentTarget && !navigationActive && (
                  <button
                    id={`btn-map-navigate-popup-${i}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNavigationActive(true);
                      setBottomSheetMinimized(true);
                      onStartNavigation();
                    }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-1 cursor-pointer animate-bounce whitespace-nowrap border border-blue-400/40 z-20 transition active:scale-95"
                    style={{ animationDuration: '2s' }}
                    title={`Start navigation to ${marker.label}`}
                  >
                    <Navigation className="w-2.5 h-2.5 fill-current rotate-45 text-white" />
                    <span>NAVIGATE</span>
                  </button>
                )}

                <button 
                  onClick={() => {
                    handleSelectNewDestination({
                      label: marker.label,
                      x: marker.x,
                      y: marker.y,
                      details: marker.details,
                      floor: currentFloor
                    });
                    setBottomSheetMinimized(false);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-125 cursor-pointer text-left focus:outline-none"
                  style={{ transform: 'translate(-50%, -50%)' }}
                  title={`Click to select ${marker.label}`}
                >
                  {/* Visual ripple */}
                  <div className="absolute -left-1.5 -top-1.5 w-6 h-6 rounded-full bg-blue-400/30 animate-ping"></div>
                  
                  {/* Custom Vector Pin */}
                  <div className={`relative w-4 h-4 ${iconColor} rounded-full border-2 border-white shadow flex items-center justify-center`}>
                    {/* Miniature central dot */}
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  </div>

                  {/* Floating minimal label pill */}
                  <div className={`absolute left-1/2 -translate-x-1/2 top-5 px-2 py-0.5 rounded text-[8px] font-bold whitespace-nowrap shadow border ${
                    isCurrentTarget 
                      ? 'bg-rose-600 text-white border-rose-400' 
                      : 'bg-slate-900/90 text-white border-white/10'
                  }`}>
                    {marker.label}
                  </div>
                </button>
              </div>
            );
          })}

          {/* REAL-TIME SIMULATED USER NAVIGATION DOT */}
          {userPos.floor === currentFloor && (
            <div 
              className="absolute z-30 transition-all duration-300 ease-out"
              style={{ 
                left: `${userPos.x}px`, 
                top: `${userPos.y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Google Maps Blue Dot with direction cursor cone */}
              <div className="relative w-6 h-6 flex items-center justify-center">
                {/* Radar ripple rings */}
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '2.5s' }}></div>
                
                {/* Center location dot */}
                <div className="w-4.5 h-4.5 bg-blue-600 dark:bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  {/* Google Maps-style directional arrow wedge */}
                  <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-white transform -translate-y-[0.5px]"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MINIMIZABLE BOTTOM SHEET DRAWER - COLLAPSES ON WAYFINDING INITIATION */}
      <div 
        className={`absolute bottom-0 inset-x-0 bg-white dark:bg-slate-900 rounded-t-[28px] border-t border-slate-200 dark:border-slate-800 shadow-2xl z-20 flex flex-col justify-between transition-all duration-300 ${
          bottomSheetMinimized ? 'p-3 px-4 pb-4 h-[80px]' : 'p-5 h-[300px]'
        }`}
      >
        {(() => {
          const totalDistance = getRouteDistance();
          const totalMinutes = Math.max(1, Math.round(totalDistance / 60));
          const remainingDistance = Math.max(10, Math.round(totalDistance * (1 - navProgress / 100)));
          const remainingMinutes = Math.max(1, Math.ceil(totalMinutes * (1 - navProgress / 100)));
          const isMultiFloor = startLocation.floor !== selectedDestination.floor;

          return bottomSheetMinimized ? (
            /* ========================================================= */
            /* MINIMIZED NAVIGATION PANEL (Google Maps HUD)              */
            /* ========================================================= */
            <div className="flex flex-col h-full justify-between">
              {/* Slide up grab bar button */}
              <button 
                onClick={() => setBottomSheetMinimized(false)}
                className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2.5 hover:bg-slate-400 transition shrink-0 cursor-pointer"
                title="Expand Details"
              ></button>

              <div className="flex items-center justify-between gap-3">
                {/* ETA remaining stats */}
                <div className="text-left flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 leading-none">
                      {remainingMinutes} min
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-wider">
                      ETA: Dynamic
                    </span>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {remainingDistance} meters
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold leading-none mt-1">
                      {isMultiFloor ? 'via Glass Lift A' : 'flat walkway'}
                    </span>
                  </div>
                </div>

                {/* Simulation interactive controller */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/80">
                  <button
                    id="btn-sim-play-pause"
                    onClick={() => setNavPlaying(!navPlaying)}
                    className="w-7 h-7 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 active:scale-90 transition cursor-pointer"
                    title={navPlaying ? "Pause Walking" : "Resume Walking"}
                  >
                    {navPlaying ? (
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <div className="flex flex-col px-1">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={navProgress} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNavProgress(val);
                        setNavPlaying(false); // Pause auto playback when scrubbed
                        if (val >= 100) {
                          setStartLocation(selectedDestination);
                        }
                      }}
                      className="w-16 h-1 bg-blue-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      title="Scrub GPS Tracker"
                    />
                    <span className="text-[7px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 text-center font-bold uppercase tracking-widest">
                      GPS TRACK
                    </span>
                  </div>
                </div>

                {/* Right column navigation actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-expand-notif-bar"
                    onClick={() => setBottomSheetMinimized(false)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                    title="Expand Route Information"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>

                  <button
                    id="btn-exit-directions"
                    onClick={() => {
                      const passengerLoc = getCurrentPassengerPosition();
                      setStartLocation(passengerLoc);
                      setNavigationActive(false);
                      setBottomSheetMinimized(false);
                      setNavProgress(0);
                    }}
                    className="h-8 px-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-100 dark:border-rose-950/50 rounded-lg text-[10px] font-black transition active:scale-95 cursor-pointer"
                  >
                    End
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* EXPANDED FULL DETAIL PANEL                                */
            /* ========================================================= */
            <>
              {/* Visual drag bar */}
              <div 
                onClick={() => {
                  if (navigationActive) {
                    setBottomSheetMinimized(true);
                  }
                }}
                className={`w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3.5 shrink-0 ${
                  navigationActive ? 'cursor-pointer hover:bg-slate-400 transition' : ''
                }`}
                title={navigationActive ? "Minimize Panel" : ""}
              ></div>

              {/* Heatmap Crowd Monitor Legend when activated */}
              {showCrowdHeatmap && (
                <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold mb-2.5 shrink-0 animate-fadeIn rounded-xl">
                  <span className="text-slate-500">STATION HEATMAP:</span>
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-green"></span> Low</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Medium</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Heavy</span>
                  </div>
                </div>
              )}

              {/* Primary Navigation / Bottom Sheet Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-2.5">
                {/* Start Location Selector */}
                <div className="text-left space-y-1">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wider uppercase block flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    YOUR START LOCATION
                  </span>
                  <div className="relative">
                    <select 
                      value={startLocation.label}
                      disabled={navigationActive}
                      onChange={(e) => {
                        const found = STATION_DESTINATIONS.find(d => d.label === e.target.value);
                        if (found) {
                          setStartLocation({
                            label: found.label,
                            x: found.x,
                            y: found.y,
                            details: found.details,
                            floor: found.floor
                          });
                          if (!navigationActive) {
                            setCurrentFloor(found.floor);
                          }
                          setNavProgress(0);
                        }
                      }}
                      className="mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
                    >
                      <optgroup label="Ground Floor (GF)">
                        {STATION_DESTINATIONS.filter(d => d.floor === 'GF').map(d => (
                          <option key={d.label} value={d.label}>{d.label} (GF)</option>
                        ))}
                      </optgroup>
                      <optgroup label="First Floor (FF)">
                        {STATION_DESTINATIONS.filter(d => d.floor === 'FF').map(d => (
                          <option key={d.label} value={d.label}>{d.label} (FF)</option>
                        ))}
                      </optgroup>
                      <optgroup label="Second Floor (SF)">
                        {STATION_DESTINATIONS.filter(d => d.floor === 'SF').map(d => (
                          <option key={d.label} value={d.label}>{d.label} (SF)</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Target Destination Selector */}
                <div className="text-left space-y-1">
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold tracking-wider uppercase block flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    TARGET DESTINATION
                  </span>
                  <div className="relative">
                    <select 
                      value={selectedDestination.label}
                      disabled={navigationActive}
                      onChange={(e) => {
                        const found = STATION_DESTINATIONS.find(d => d.label === e.target.value);
                        if (found) {
                          handleSelectNewDestination({
                            label: found.label,
                            x: found.x,
                            y: found.y,
                            details: found.details,
                            floor: found.floor
                          });
                        }
                      }}
                      className="mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
                    >
                      <optgroup label="Ground Floor (GF)">
                        {STATION_DESTINATIONS.filter(d => d.floor === 'GF').map(d => (
                          <option key={d.label} value={d.label}>{d.label} (GF)</option>
                        ))}
                      </optgroup>
                      <optgroup label="First Floor (FF)">
                        {STATION_DESTINATIONS.filter(d => d.floor === 'FF').map(d => (
                          <option key={d.label} value={d.label}>{d.label} (FF)</option>
                        ))}
                      </optgroup>
                      <optgroup label="Second Floor (SF)">
                        {STATION_DESTINATIONS.filter(d => d.floor === 'SF').map(d => (
                          <option key={d.label} value={d.label}>{d.label} (SF)</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Stats Banner */}
              <div className="flex justify-between items-center bg-blue-50/40 dark:bg-slate-950 p-2.5 rounded-2xl border border-blue-100/30 dark:border-slate-850 mb-2 shrink-0">
                <div className="text-left">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block">ROUTE PROFILE</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    Distance: <strong className="text-slate-900 dark:text-white font-black">{totalDistance} meters</strong> &bull; Floors: <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{startLocation.floor} &rarr; {selectedDestination.floor}</strong>
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="bg-blue-600 text-white rounded-lg px-2.5 py-1 text-center shrink-0 shadow-sm">
                    <span className="text-[7px] text-blue-100 block font-bold leading-none uppercase">TIME</span>
                    <span className="text-xs font-mono font-black">{totalMinutes} min</span>
                  </div>
                </div>
              </div>

              {/* Checkpoint Progress Stepper showing list of locations and statuses */}
              <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar shrink-0">
                {getPathPoints().map((checkpoint, idx) => {
                  const isReached = navProgress >= (idx * 25);
                  const isCurrent = navProgress >= ((idx - 1) * 25) && navProgress < (idx * 25);
                  return (
                    <div key={idx} className="flex items-center gap-1 shrink-0">
                      <div className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold flex items-center gap-1.5 transition-all duration-300 ${
                        isReached 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                          : isCurrent 
                            ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 text-slate-400 dark:text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isReached ? 'bg-emerald-500' : isCurrent ? 'bg-white' : 'bg-slate-400'}`}></span>
                        <span>{checkpoint.label}</span>
                      </div>
                      {idx < 4 && <span className="text-slate-300 dark:text-slate-700 text-[10px]">&rarr;</span>}
                    </div>
                  );
                })}
              </div>

              {/* Success Finished Banner or AI Alternative Suggestion Banner */}
              {navProgress >= 100 ? (
                <div className="mt-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-2.5 flex items-start gap-2.5 text-[11px] text-left leading-relaxed text-emerald-800 dark:text-emerald-400 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Destination Arrived!</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Locator has successfully stopped at {selectedDestination.label}. Click 'Reset Navigation' or choose another location to explore.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 bg-blue-50/50 dark:bg-slate-950 border border-blue-100 dark:border-slate-800 rounded-xl p-2.5 flex items-start gap-2.5 text-[11px] text-left leading-relaxed text-slate-600 dark:text-slate-400">
                  <AlertCircle className="w-4 h-4 text-emerald-green shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-blue-900 dark:text-blue-400 font-semibold">AI Routing Recommendation</strong>: Use Exit Corridor B bypass. It features ramp layouts (wheelchair friendly) and avoids current Platform 4 boarding crowds.
                  </p>
                </div>
              )}

              {/* Start Directions Button / Minimize Controls */}
              <div className="flex gap-2.5 mt-3.5">
                {navigationActive && (
                  <button
                    id="btn-sheet-minimize"
                    onClick={() => setBottomSheetMinimized(true)}
                    className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    title="Minimize Panel"
                  >
                    Minimize
                  </button>
                )}
                {navProgress >= 100 ? (
                  <button
                    id="btn-reset-directions"
                    onClick={() => {
                      setStartLocation(selectedDestination);
                      setNavigationActive(false);
                      setNavProgress(0);
                      setNavPlaying(true);
                    }}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-98 transition"
                  >
                    Reset Navigation & Wayfinding
                  </button>
                ) : (
                  <button
                    id="btn-start-directions"
                    onClick={() => {
                      setNavigationActive(true);
                      setBottomSheetMinimized(true);
                      onStartNavigation();
                    }}
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer active:scale-98 transition"
                  >
                    <Navigation className="w-4.5 h-4.5 animate-pulse" /> Navigate to {selectedDestination.label}
                  </button>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
