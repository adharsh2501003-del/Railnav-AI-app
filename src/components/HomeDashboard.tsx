import React, { useState } from 'react';
import { 
  Search, Train, ArrowRight, MapPin, Map, Bell, Compass, AlertCircle, Clock,
  ChevronRight, Ticket, Utensils, Home, ArrowUpRight, HelpCircle, 
  HelpCircle as LiftIcon, ArrowRightLeft, ShieldAlert, Zap, HeartPulse,
  DollarSign, Coffee, ArrowUpDown, Bath
} from 'lucide-react';
import { Train as TrainType } from '../types';

interface HomeDashboardProps {
  userName: string;
  isDarkMode: boolean;
  onSearchFocus: () => void;
  onQuickAction: (actionId: string) => void;
  onNavigateTrain: (train: TrainType) => void;
  activeNotificationsCount: number;
  setScreen: (screen: string) => void;
}

export default function HomeDashboard({
  userName,
  isDarkMode,
  onSearchFocus,
  onQuickAction,
  onNavigateTrain,
  activeNotificationsCount,
  setScreen,
}: HomeDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Rich sample live trains for Indian Railways
  const liveTrain: TrainType = {
    number: '12002',
    name: 'NDLS Shatabdi Exp',
    platform: '5',
    departureTime: '06:15 AM',
    coachPosition: ['ENG', 'C1', 'C2', 'C3', 'C4', 'C5', 'E1', 'E2'],
    delayStatus: {
      delayed: true,
      minutes: 10,
    },
    crowdLevel: 'Medium',
    nearbyFacilities: [
      { icon: 'Restroom', label: 'Restroom', distance: '15m' },
      { icon: 'Escalator', label: 'Escalator', distance: '30m' },
    ],
    nearestLift: 'Elevator Lift B',
    nearestEscalator: 'Escalator 2A',
    nearestExit: 'Exit Gate A (North)',
  };

  const quickActions = [
    { id: 'platform', label: 'Find Platform', icon: <Train className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />, color: 'bg-blue-50 hover:bg-blue-100/50 dark:bg-slate-900 text-[#0052CC] dark:text-blue-400' },
    { id: 'ticket', label: 'Ticket Counter', icon: <Ticket className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />, color: 'bg-orange-50 hover:bg-orange-100/50 dark:bg-slate-900 text-orange-600 dark:text-orange-400' },
    { id: 'food', label: 'Food Court', icon: <Utensils className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />, color: 'bg-emerald-50 hover:bg-emerald-100/50 dark:bg-slate-900 text-emerald-green dark:text-emerald-400' },
    { id: 'restroom', label: 'Restroom', icon: <Bath className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />, color: 'bg-indigo-50 hover:bg-indigo-100/50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400' },
    { id: 'waiting', label: 'Waiting Hall', icon: <Coffee className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />, color: 'bg-purple-50 hover:bg-purple-100/50 dark:bg-slate-900 text-purple-600 dark:text-purple-400' },
    { id: 'lift', label: 'Elevator Lift', icon: <ArrowUpDown className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-[-2px] group-hover:scale-110" />, color: 'bg-teal-50 hover:bg-teal-100/50 dark:bg-slate-900 text-teal-600 dark:text-teal-400' },
    { id: 'escalator', label: 'Escalator', icon: <ArrowRightLeft className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />, color: 'bg-amber-50 hover:bg-amber-100/50 dark:bg-slate-900 text-amber-600 dark:text-amber-400' },
    { id: 'exit', label: 'Exit Gate', icon: <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />, color: 'bg-rose-50 hover:bg-rose-100/50 dark:bg-slate-900 text-rose-600 dark:text-rose-400' },
    { id: 'atm', label: 'ATM Center', icon: <DollarSign className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />, color: 'bg-pink-50 hover:bg-pink-100/50 dark:bg-slate-900 text-pink-600 dark:text-pink-400' },
    { id: 'charging', label: 'Charging Stn', icon: <Zap className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:animate-pulse" />, color: 'bg-yellow-50 hover:bg-yellow-100/50 dark:bg-slate-900 text-yellow-600 dark:text-yellow-400' },
    { id: 'medical', label: 'Medical Room', icon: <HeartPulse className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />, color: 'bg-red-50 hover:bg-red-100/50 dark:bg-slate-900 text-red-600 dark:text-red-400' },
    { id: 'police', label: 'Police Booth', icon: <ShieldAlert className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />, color: 'bg-slate-100 hover:bg-slate-200/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  ];

  return (
    <div
      id="dashboard-container"
      className={`w-full h-full flex flex-col overflow-y-auto transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Welcome Bar */}
      <div className="p-5 pb-2 flex items-center justify-between">
        <div className="text-left">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block uppercase tracking-wide">
            Welcome back
          </span>
          <h2 className="text-xl font-bold tracking-tight">
            Good Morning, {userName} 👋
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Where are you going today?
          </p>
        </div>

        {/* Notifications Icon Badge */}
        <button
          id="btn-dash-notifications"
          onClick={() => setScreen('notifications')}
          className="relative w-11 h-11 rounded-[16px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 transition shadow-sm"
        >
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          {activeNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
              {activeNotificationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Floating Search Bar */}
      <div className="px-5 py-3 sticky top-0 z-10 bg-slate-50/85 dark:bg-slate-950/85 backdrop-blur-md">
        <div 
          onClick={onSearchFocus}
          className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-5 flex items-center gap-3 cursor-pointer shadow-sm hover:border-blue-400 dark:hover:border-blue-800 transition"
        >
          <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
          <input
            id="dash-search-input"
            type="text"
            readOnly
            placeholder="Search platform, restroom, food court..."
            value={searchQuery}
            className="bg-transparent text-xs font-medium w-full focus:outline-none pointer-events-none text-slate-600 dark:text-slate-300"
          />
          <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
        </div>
      </div>

      {/* Quick Actions Grid Container */}
      <div className="px-5 py-2">
        <div className="flex items-center justify-between mb-3 text-left">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Quick Actions
          </h3>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-slate-900 px-2 py-0.5 rounded-md">
            12 Stations
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {quickActions.map((action) => (
            <button
              key={action.id}
              id={`btn-action-${action.id}`}
              onClick={() => onQuickAction(action.id)}
              className="flex flex-col items-center justify-center text-center p-2.5 bg-white dark:bg-slate-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-200 group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition ${action.color} group-hover:scale-105`}>
                {action.icon}
              </div>
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Train Card - Bento styled */}
      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-green animate-pulse"></span>
            Your Ticket & Active Train
          </h3>
          <span className="text-[10px] font-mono text-emerald-green bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
            On Time
          </span>
        </div>

        <div className="bento-card border-l-4 border-l-[#0052CC] bg-white dark:bg-slate-900 p-5 flex flex-col justify-between relative overflow-hidden mb-4">
          <div className="flex justify-between items-start mb-3">
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                Live Train Status
              </span>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white leading-tight">
                {liveTrain.number} &bull; {liveTrain.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">NDLS &rarr; KLK</p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block mb-1">
                DEPARTS
              </span>
              <span className="font-mono font-bold text-sm text-slate-800 dark:text-white flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {liveTrain.departureTime}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-end mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-3">
            <div className="text-3xl font-black text-[#0052CC] dark:text-blue-400">
              PF {liveTrain.platform}
            </div>
            <div className="text-right text-[10px] font-bold text-slate-400 dark:text-slate-500">
              {liveTrain.delayStatus.delayed ? (
                <span className="text-amber-500 font-bold">+{liveTrain.delayStatus.minutes} mins delay</span>
              ) : (
                <span className="text-emerald-green font-bold">No delay</span>
              )}
            </div>
          </div>

          {/* Navigation Button */}
          <button
            id="btn-train-navigate"
            onClick={() => onNavigateTrain(liveTrain)}
            className="mt-4 w-full h-11 bg-[#0052CC] hover:bg-[#003D99] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '4s' }} />
            Start Platform 5 Directions
          </button>
        </div>

        {/* Coach Position Bento Widget */}
        <div className="bento-card bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none p-5 flex flex-col justify-between mb-4">
          <div className="mb-3 text-left">
            <h4 className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Coach Layout Position</h4>
            <p className="text-base font-bold mt-1">
              S4, S5, S6 coaches near central elevator
            </p>
          </div>
          
          <div className="flex gap-1 overflow-x-auto pb-2 max-w-full no-scrollbar">
            {liveTrain.coachPosition.map((coach, i) => (
              <span 
                key={i} 
                className={`text-[8px] font-black px-2 py-1 rounded shrink-0 ${
                  coach.startsWith('E') 
                    ? 'bg-amber-400 text-slate-900 border border-amber-300' 
                    : coach === 'ENG'
                    ? 'bg-slate-900 text-white border border-slate-800'
                    : 'bg-white/20 text-white'
                }`}
              >
                {coach}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 border-t border-white/10 pt-3 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] opacity-75">Platform Services:</span>
              <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded">RO Water & Toilets</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-300">PF 5 Center</span>
          </div>
        </div>
      </div>

      {/* Tips & Crowd Advisory Bento Monitor */}
      <div className="px-5 py-2 mb-4">
        <div className="bento-card bg-slate-900 dark:bg-slate-950 text-white border-none p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Crowd Monitor
            </span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-300 text-left">
            Platform 5 concourse is currently <span className="text-emerald-400 font-extrabold uppercase">Low Crowd</span>. Ideal for wheelchair accessibility & comfortable seating.
          </p>
          
          <div className="mt-4 grid grid-cols-5 gap-1.5">
            <div className="h-8 bg-emerald-500/20 rounded-lg animate-pulse"></div>
            <div className="h-8 bg-emerald-500/40 rounded-lg animate-pulse" style={{ animationDelay: '100ms' }}></div>
            <div className="h-8 bg-emerald-500/30 rounded-lg animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="h-8 bg-emerald-500/20 rounded-lg animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <div className="h-8 bg-emerald-500/10 rounded-lg animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-start gap-2 text-[11px] text-slate-400 text-left">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Platform 6 walkway is heavily crowded. RailNav AI advises taking Corridor B via escalator 2A to save 4 mins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
