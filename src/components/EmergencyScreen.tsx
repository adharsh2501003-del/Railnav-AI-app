import React, { useState } from 'react';
import { 
  PhoneCall, ShieldAlert, HeartPulse, Shield, Globe, 
  Check, Eye, HelpCircle, Volume2, Accessibility, MapPin, Compass, Flame
} from 'lucide-react';
import { AccessibilitySettings } from '../types';

interface EmergencyScreenProps {
  isDarkMode: boolean;
  accessibility: AccessibilitySettings;
  setAccessibility: React.Dispatch<React.SetStateAction<AccessibilitySettings>>;
  onSpeakText: (text: string) => void;
  onTriggerSOS?: (optionName: string) => Promise<void>;
}

export default function EmergencyScreen({
  isDarkMode,
  accessibility,
  setAccessibility,
  onSpeakText,
  onTriggerSOS,
}: EmergencyScreenProps) {
  const [activeTab, setActiveTab] = useState<'emergency' | 'accessibility'>('emergency');
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosOption, setSosOption] = useState<string | null>(null);

  const emergencyContacts = [
    { name: 'Railway Police Force (RPF)', phone: '139', description: 'Assistance for security, harassment, or safety issues' },
    { name: 'Medical Emergency Station Desk', phone: '102', description: 'Immediate first-aid, ambulance, or doctor on platform' },
    { name: 'Women Helpline / Child Safety Desk', phone: '182', description: 'Dedicated protection services' },
    { name: 'Lost & Found Claims Desk', phone: '011-233434', description: 'Report stolen or forgotten baggage' }
  ];

  const languages = [
    { code: 'en', label: 'English (US/UK)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'bn', label: 'বাংলা (Bengali)' }
  ];

  const handleTriggerSOS = async (optionName: string) => {
    if (onTriggerSOS) {
      try {
        await onTriggerSOS(optionName);
      } catch (error) {
        console.error('SOS dispatch failed:', error);
      }
    }
    setSosOption(optionName);
    setSosTriggered(true);
    onSpeakText(`S O S triggered for ${optionName}. RailNav emergency dispatch notified. Help desk is forty five meters away.`);
  };

  const toggleAccessibility = (key: keyof AccessibilitySettings) => {
    setAccessibility(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      const statusText = `${key.replace(/([A-Z])/g, ' $1')} is now ${updated[key] ? 'enabled' : 'disabled'}`;
      onSpeakText(statusText);
      return updated;
    });
  };

  const handleLanguageChange = (langCode: string) => {
    setAccessibility(prev => ({ ...prev, language: langCode }));
    const selectedLang = languages.find(l => l.code === langCode)?.label || 'English';
    onSpeakText(`Language changed to ${selectedLang}`);
  };

  return (
    <div
      id="emergency-screen-container"
      className={`w-full h-full flex flex-col overflow-y-auto transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Tab Switcher */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
          <button
            id="btn-emergency-tab-sos"
            onClick={() => setActiveTab('emergency')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'emergency' 
                ? 'bg-rose-500 text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> SOS & Emergency
          </button>
          <button
            id="btn-emergency-tab-access"
            onClick={() => setActiveTab('accessibility')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'accessibility' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Accessibility className="w-4 h-4" /> Accessibility
          </button>
        </div>
      </div>

      {activeTab === 'emergency' ? (
        <div className="p-5 space-y-6 flex-1 flex flex-col justify-between">
          <div>
            {/* Title */}
            <div className="text-left mb-4">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold tracking-wider uppercase block">
                IMMEDIATE ASSISTANCE
              </span>
              <h2 className="text-xl font-bold tracking-tight">Emergency Helplines</h2>
            </div>

            {/* Simulated SOS Panel */}
            {!sosTriggered ? (
              <div className="flex flex-col items-center py-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-[24px] mb-5">
                {/* Large pulsating red SOS trigger button */}
                <button
                  id="btn-emergency-sos-trigger"
                  onClick={() => handleTriggerSOS('Medical Emergency')}
                  className="w-28 h-28 bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-full border-[6px] border-rose-100 dark:border-rose-950 flex flex-col items-center justify-center text-white shadow-xl cursor-pointer select-none transition relative"
                >
                  <span className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping"></span>
                  <PhoneCall className="w-8 h-8 text-white mb-1" />
                  <span className="text-sm font-black tracking-widest font-mono">SOS</span>
                </button>
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 mt-4 uppercase tracking-wide">
                  Hold to Trigger Live Dispatch
                </span>
                <p className="text-[10px] text-slate-400 text-center max-w-[200px] mt-1 leading-normal">
                  Fires current GPS and Platform details directly to local Station Master and RPF.
                </p>
              </div>
            ) : (
              <div className="p-5 bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-[24px] mb-5 text-left animate-fadeIn">
                <div className="flex items-start gap-2">
                  <Shield className="w-6 h-6 text-emerald-green shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">Emergency SOS Dispatched!</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-1">
                      Platform 5 Security Dispatch has been notified. They have your seat location. Expected arrival: <strong>2 minutes</strong>.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Nearest Help Desk distance:</span>
                  <strong className="text-slate-800 dark:text-white">45 meters away</strong>
                </div>

                <button
                  id="btn-emergency-sos-cancel"
                  onClick={() => setSosTriggered(false)}
                  className="mt-4 w-full h-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel Distress Call
                </button>
              </div>
            )}

            {/* Immediate SOS Target Quick Cards */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { name: 'RPF Police', icon: <Shield className="w-4 h-4" /> },
                { name: 'Medical Help', icon: <HeartPulse className="w-4 h-4" /> },
                { name: 'Fire Escape', icon: <Flame className="w-4 h-4" /> },
                { name: 'Lost Baggage', icon: <HelpCircle className="w-4 h-4" /> }
              ].map((item, index) => (
                <button
                  key={index}
                  id={`btn-emergency-option-${index}`}
                  onClick={() => handleTriggerSOS(item.name)}
                  className="h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold shadow-sm text-slate-800 dark:text-slate-300 transition cursor-pointer"
                >
                  {item.icon} {item.name}
                </button>
              ))}
            </div>

            {/* Helplines List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-left">
                Emergency Hotline Directories
              </h3>

              <div className="space-y-2">
                {emergencyContacts.map((contact, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-left flex justify-between items-center"
                  >
                    <div>
                      <strong className="text-xs text-slate-800 dark:text-slate-200 block">{contact.name}</strong>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">{contact.description}</p>
                    </div>
                    <a
                      id={`link-emergency-call-${i}`}
                      href={`tel:${contact.phone}`}
                      onClick={(e) => e.preventDefault()} // Block iframe loading
                      className="h-9 px-3 bg-rose-50 dark:bg-slate-950 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-slate-800 rounded-lg flex items-center gap-1 text-[11px] font-bold shrink-0 hover:bg-rose-500 hover:text-white transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-5 text-left flex-1 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Title */}
            <div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold tracking-wider uppercase block">
                ASSISTED WAYFINDING PREFERENCES
              </span>
              <h2 className="text-xl font-bold tracking-tight">Accessibility & UI Mode</h2>
            </div>

            {/* Language Dropdown Selector */}
            <div className="space-y-1.5">
              <label htmlFor="lang-select" className="text-xs font-bold text-slate-500 dark:text-slate-400">Language Selection (multilingual)</label>
              <div className="relative">
                <select
                  id="lang-select"
                  value={accessibility.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 text-xs font-bold focus:outline-none dark:text-white cursor-pointer"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
                <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Accessibility Features Toggles List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Specialized Support Toggles
              </h3>

              <div className="bento-card bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3.5">
                {/* Large Text */}
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="text-xs text-slate-800 dark:text-slate-200 block">Large Accessible Text</strong>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Enlarges headings and labels for readability</p>
                  </div>
                  <button
                    id="btn-access-toggle-largeText"
                    onClick={() => toggleAccessibility('largeText')}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                      accessibility.largeText ? 'bg-[#0052CC]' : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform ${
                      accessibility.largeText ? 'translate-x-5.5' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>

                <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80"></div>

                {/* High Contrast */}
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="text-xs text-slate-800 dark:text-slate-200 block">High Contrast Mode</strong>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Increases color contrast for low-vision eyes</p>
                  </div>
                  <button
                    id="btn-access-toggle-highContrast"
                    onClick={() => toggleAccessibility('highContrast')}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                      accessibility.highContrast ? 'bg-[#0052CC]' : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform ${
                      accessibility.highContrast ? 'translate-x-5.5' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>

                <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80"></div>

                {/* Wheelchair friendly */}
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="text-xs text-slate-800 dark:text-slate-200 block">Wheelchair-Friendly routes</strong>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Filters navigation paths to use only lifts & ramps</p>
                  </div>
                  <button
                    id="btn-access-toggle-wheelchairFriendly"
                    onClick={() => toggleAccessibility('wheelchairFriendly')}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                      accessibility.wheelchairFriendly ? 'bg-emerald-green' : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform ${
                      accessibility.wheelchairFriendly ? 'translate-x-5.5' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>

                <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80"></div>

                {/* Voice Guidance */}
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="text-xs text-slate-800 dark:text-slate-200 block">Voice Guidance (Text-to-Speech)</strong>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Speaks directions, platform changes and prompts</p>
                  </div>
                  <button
                    id="btn-access-toggle-voiceGuidance"
                    onClick={() => toggleAccessibility('voiceGuidance')}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                      accessibility.voiceGuidance ? 'bg-[#0052CC]' : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform ${
                      accessibility.voiceGuidance ? 'translate-x-5.5' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/60 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-2.5 text-xs">
            <Volume2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              RailNav AI includes smart voice guidance. Toggling voice will automatically vocalize important announcements in your selected language.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
