import React, { useState } from 'react';
import { 
  User, Map, Heart, Globe, Moon, Sun, Accessibility, MessageSquare, 
  HelpCircle, Info, LogOut, Download, CheckCircle, Loader2, Star,
  Cpu, Smartphone, Layers
} from 'lucide-react';
import { AccessibilitySettings } from '../types';

interface ProfileScreenProps {
  userName: string;
  userPhone: string;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  accessibility: AccessibilitySettings;
  onLogout: () => void;
  setScreen: (screen: string) => void;
  screensList: { id: string; name: string; icon: string }[];
}

export default function ProfileScreen({
  userName,
  userPhone,
  isDarkMode,
  setIsDarkMode,
  accessibility,
  onLogout,
  setScreen,
  screensList,
}: ProfileScreenProps) {
  const [downloadingMap, setDownloadingMap] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [mapDownloaded, setMapDownloaded] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const savedCommutes = [
    { from: 'New Delhi (NDLS)', to: 'Kalka (KLK)', station: 'New Delhi Junction' },
    { from: 'Chennai Central (MAS)', to: 'Bangalore (SBC)', station: 'MGR Chennai Central' }
  ];

  const handleDownloadMaps = () => {
    if (mapDownloaded) return;
    setDownloadingMap(true);
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadingMap(false);
          setMapDownloaded(true);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setDownloadingMap(true); // show loader
    setTimeout(() => {
      setDownloadingMap(false);
      setFeedbackSent(true);
      setFeedbackText('');
    }, 600);
  };

  return (
    <div
      id="profile-screen-container"
      className={`w-full h-full flex flex-col overflow-y-auto transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Profile Header Block */}
      <div className="p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 text-left">
        <div className="flex items-center gap-4">
          {/* Avatar frame */}
          <div className="w-14 h-14 rounded-full bg-blue-600 border-2 border-white dark:border-slate-800 shadow-md flex items-center justify-center text-white font-black text-xl select-none">
            {userName.charAt(0)}
          </div>

          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{userName}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{userPhone}</p>
            <span className="inline-block text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full mt-1.5 uppercase">
              ★ RailNav Gold VIP
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-left">
        {/* Offline Station Maps Downloader */}
        <div className="bento-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3.5">
          <div className="flex items-start gap-3">
            <Map className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-xs text-slate-800 dark:text-slate-200 block">Offline Station Map Pack</strong>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                Download layouts of major Indian junctions for full functionality without cellular connection.
              </p>
            </div>
          </div>

          {downloadingMap ? (
            <div className="space-y-2 text-xs font-bold font-mono">
              <div className="flex justify-between text-slate-500">
                <span>PACKING VECTOR LAYOUTS...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-150" style={{ width: `${downloadProgress}%` }}></div>
              </div>
            </div>
          ) : mapDownloaded ? (
            <div className="flex items-center gap-1.5 text-emerald-green text-xs font-bold">
              <CheckCircle className="w-4 h-4" /> Offline maps ready (24 MB)
            </div>
          ) : (
            <button
              id="btn-profile-download-maps"
              onClick={handleDownloadMaps}
              className="h-10 px-4 bg-blue-50 dark:bg-slate-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Northern Railway Pack
            </button>
          )}
        </div>

        {/* Saved Commute Routes */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" /> Saved Daily Routes
          </h3>

          <div className="space-y-2">
            {savedCommutes.map((comm, index) => (
              <div 
                key={index}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex justify-between items-center text-xs"
              >
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">{comm.from} &rarr; {comm.to}</strong>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">Preset: {comm.station}</p>
                </div>
                <button
                  id={`btn-profile-commute-${index}`}
                  onClick={() => setScreen('map')}
                  className="h-8 px-3.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg font-bold cursor-pointer transition hover:bg-slate-100"
                >
                  Start Map
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* MVP Sandbox Simulator Controls */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-left">
            Developer Simulation Control
          </h3>

          <div className="bento-card bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-left">
                <strong className="text-xs text-slate-800 dark:text-slate-200 block">MVP Screen Jumper</strong>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                  Instantly route and test any of the MVP components directly inside this layout chassis:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {screensList.map((s, idx) => (
                <button
                  key={s.id}
                  id={`btn-profile-sim-${s.id}`}
                  onClick={() => setScreen(s.id)}
                  className="px-3 py-2 bg-slate-50 hover:bg-[#0052CC]/10 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center justify-between text-[11px] transition duration-200 cursor-pointer text-left hover:border-blue-400"
                >
                  <span className="truncate flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-slate-400">{(idx + 1).toString().padStart(2, '0')}</span>
                    <span className="truncate">{s.name.replace(' Screen', '').replace(' (3 Screens)', '')}</span>
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold">&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global UI Preference Switches */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            UI Styling Configuration
          </h3>

          <div className="bento-card bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3.5 text-xs">
            {/* Inline Dark Mode switch */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <div className="text-left">
                  <strong className="text-slate-800 dark:text-slate-200 block">Dark Mode Support</strong>
                  <p className="text-[10px] text-slate-400 mt-0.5">Eye-safe rendering during night journeys</p>
                </div>
              </div>
              <button
                id="btn-profile-darkmode-toggle"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors ${
                  isDarkMode ? 'bg-[#0052CC]' : 'bg-slate-300 dark:bg-slate-800'
                }`}
              >
                <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform ${
                  isDarkMode ? 'translate-x-5.5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80"></div>

            {/* Accessibility presets link */}
            <button
              id="btn-profile-link-access"
              onClick={() => setScreen('emergency')}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Accessibility className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                <div>
                  <strong className="block">Accessibility Configuration</strong>
                  <p className="text-[10px] text-slate-400 mt-0.5">Configure large text, speech guides, and ramps</p>
                </div>
              </div>
              <span className="text-[10px] text-blue-600 font-bold">&rarr;</span>
            </button>
          </div>
        </div>

        {/* Feedback form */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Send Feedback & Ideas
          </h3>

          <div className="bento-card bg-white dark:bg-slate-900 p-5 shadow-sm">
            {feedbackSent ? (
              <div className="flex items-center gap-2 text-emerald-green text-xs font-bold py-2">
                <CheckCircle className="w-4.5 h-4.5 animate-bounce" /> Thank you! Your ideas help millions of travelers.
              </div>
            ) : (
              <form id="form-profile-feedback" onSubmit={handleFeedbackSubmit} className="space-y-3">
                <textarea
                  id="profile-feedback-text"
                  required
                  rows={2}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us about your indoor routing experience..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 dark:text-white"
                />
                <button
                  id="btn-profile-submit-feedback"
                  type="submit"
                  className="h-9 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white dark:text-slate-200 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>

        {/* General Links (Help center, About, Logout) */}
        <div className="bento-card bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3.5 text-xs">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">Help Center & FAQs</span>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80"></div>

          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">About RailNav AI (v1.4.0)</span>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80"></div>

          <button
            id="btn-profile-logout"
            onClick={onLogout}
            className="w-full flex items-center gap-3 text-rose-500 font-bold hover:bg-rose-50/20 py-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
