import React, { useState, useEffect } from 'react';
import { 
  Home, Map, MessageSquare, Layers, ShieldAlert, User, Bell, Compass 
} from 'lucide-react';

// Import Types
import { Train, AppNotification, AccessibilitySettings } from './types';

// Import Components
import DeviceFrame from './components/DeviceFrame';
import SplashScreen from './components/SplashScreen';
import OnboardingScreen from './components/OnboardingScreen';
import LoginScreen from './components/LoginScreen';
import HomeDashboard from './components/HomeDashboard';
import StationMap from './components/StationMap';
import AIAssistant from './components/AIAssistant';
import PlatformDetails from './components/PlatformDetails';
import EmergencyScreen from './components/EmergencyScreen';
import NotificationsScreen from './components/NotificationsScreen';
import ProfileScreen from './components/ProfileScreen';
import { getNotifications, subscribeToLiveEvents, triggerSOS } from './api/client';
import { LanguageContext, t } from './i18n';
import { STATION_DESTINATIONS } from './data';

export default function App() {
  // Mobile simulation state flow
  const [screen, setScreen] = useState<string>('splash');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Adharsh');
  const [userPhone, setUserPhone] = useState<string>('+91 9876543210');
  const kioskMode = import.meta.env.VITE_KIOSK_MODE === 'true' || new URLSearchParams(window.location.search).has('kiosk');
  const [kioskIdle, setKioskIdle] = useState(false);

  // Pre-configured simulation variables for cross-screen transitions
  const [selectedMapFilter, setSelectedMapFilter] = useState<string>('');
  const [selectedMapRoute, setSelectedMapRoute] = useState<boolean>(false);
  const [selectedMapDestination, setSelectedMapDestination] = useState<any>(null);

  // Accessibility State
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    largeText: false,
    highContrast: false,
    wheelchairFriendly: false,
    voiceGuidance: false,
    language: 'en',
  });

  // Active Simulated Notifications Array
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      type: 'platform',
      title: 'Platform Changed - 12002',
      message: 'NDLS Shatabdi Express has been re-allocated to Platform 5 instead of Platform 3. Update your map path.',
      time: 'Just Now',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'delay',
      title: 'Train Delayed - Kerala Exp',
      message: 'Kerala Express (12626) is running delayed by 25 minutes. New ETA is 11:45 AM.',
      time: '10 mins ago',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'route',
      title: 'Route Alternate Suggested',
      message: 'High crowd density detected on Platform 4 escalator link. Tap to reroute via Elevator Lobby B.',
      time: '25 mins ago',
      read: false,
    },
    {
      id: 'notif-4',
      type: 'crowd',
      title: 'High Crowd Alert',
      message: 'Heavy crowd alert on Platform 6 main foyer. Avoid central ticketing terminal for the next 20 mins.',
      time: '1 hour ago',
      read: true,
    },
    {
      id: 'notif-5',
      type: 'announcement',
      title: 'Station Announcement',
      message: 'Free RO mineral water stations are now fully operational on platforms 1, 3, 5, and 8.',
      time: '2 hours ago',
      read: true,
    }
  ]);

  // Voice Speech Synthesis Helper
  const handleSpeakText = (text: string, force = false) => {
    if (!accessibility.voiceGuidance && !force) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel active speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = accessibility.language === 'hi'
          ? 'hi-IN'
          : accessibility.language === 'bn'
            ? 'bn-IN'
            : accessibility.language === 'ta'
              ? 'ta-IN'
              : 'en-IN';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech synthesis blocked by browser security guidelines:', e);
    }
  };

  useEffect(() => {
    if (!kioskMode) return;
    let timer: number;
    const reset = () => {
      window.clearTimeout(timer);
      setKioskIdle(false);
      timer = window.setTimeout(() => { setKioskIdle(true); setScreen('splash'); }, 120000);
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, reset));
    reset();
    return () => { window.clearTimeout(timer); events.forEach((event) => window.removeEventListener(event, reset)); };
  }, [kioskMode]);

  // Pre-configured screens list for our Sandbox Developer Side panel
  const screensList = [
    { id: 'splash', name: 'Splash Screen', icon: 'Train' },
    { id: 'onboarding', name: 'Onboarding (3 Screens)', icon: 'Compass' },
    { id: 'login', name: 'Login Screen', icon: 'Smartphone' },
    { id: 'dashboard', name: 'Home Dashboard', icon: 'Home' },
    { id: 'map', name: 'Interactive Station Map', icon: 'Map' },
    { id: 'assistant', name: 'AI Assistant Chat', icon: 'MessageSquare' },
    { id: 'platform', name: 'Platform Details', icon: 'Layers' },
    { id: 'emergency', name: 'Emergency & Accessibility', icon: 'ShieldAlert' },
    { id: 'notifications', name: 'Active Notifications', icon: 'Bell' },
    { id: 'profile', name: 'Passenger Profile', icon: 'User' },
  ];

  const activeNotificationsCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let cancelled = false;
    getNotifications('ndls').then((remoteNotifications) => {
      if (!cancelled && remoteNotifications.length > 0) setNotifications(remoteNotifications);
    }).catch((error) => console.warn('Unable to load live notifications:', error));
    const unsubscribe = subscribeToLiveEvents('ndls', (event) => {
      setNotifications((previous) => [event, ...previous.filter((item) => item.id !== event.id)]);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Handle Home Quick Actions to Map redirection
  const handleQuickAction = (actionId: string) => {
    let mapFilter = '';
    if (actionId === 'restroom') mapFilter = 'restrooms';
    if (actionId === 'food') mapFilter = 'food';
    if (actionId === 'lift') mapFilter = 'elevators';
    if (actionId === 'escalator') mapFilter = 'escalators';
    if (actionId === 'atm') mapFilter = 'atms';
    if (actionId === 'charging') mapFilter = 'charging';

    const destinationLabels: Record<string, string> = {
      ticket: 'Ticket Counter North',
      food: 'IRCTC Food Court',
      restroom: 'Restroom Block A',
      waiting: 'General Waiting Room',
      lift: 'Glass Lift A',
      escalator: 'Platform 6 Stairs',
      exit: 'Platform 5',
      atm: 'State Bank ATM',
      charging: 'Charging Point Station B',
    };
    const destination = destinationLabels[actionId]
      ? STATION_DESTINATIONS.find((item) => item.label === destinationLabels[actionId])
      : undefined;

    if (mapFilter || destination) {
      setSelectedMapFilter(mapFilter);
      setSelectedMapDestination(destination || null);
      setSelectedMapRoute(Boolean(destination));
      setScreen('map');
      if (destination) {
        handleSpeakText(`Starting navigation to ${destination.label}. Follow the highlighted route.`, true);
      }
    } else if (actionId === 'police' || actionId === 'medical') {
      setScreen('emergency');
    } else if (actionId === 'platform') {
      setScreen('platform');
    } else {
      setScreen('map');
    }
  };

  const handleNavigateTrain = (train: Train) => {
    setSelectedMapFilter('platforms');
    setSelectedMapRoute(true);
    setScreen('map');
    handleSpeakText(`Starting navigation to platform ${train.platform} for ${train.name}. Follow the highlighted route.`, true);
  };

  const handleLoginSuccess = (name: string, phone: string) => {
    setUserName(name);
    setUserPhone(phone);
    setIsGuest(phone === 'Unregistered Guest');
    setUserLoggedIn(true);
    setScreen('dashboard');
    handleSpeakText(`Welcome to RailNav AI, ${name}. Your ticket details for NDLS Shatabdi Express are synchronized.`);
  };

  const handleLogout = () => {
    setUserLoggedIn(false);
    setIsGuest(false);
    setScreen('login');
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    handleSpeakText('All announcements marked as read.');
  };

  const handleClearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Synchronize CSS class for Dark Mode inside Device Frame
  const activeStyleClasses = `${accessibility.largeText ? 'text-lg font-bold' : ''} ${
    accessibility.highContrast ? 'contrast-125 saturate-150' : ''
  }`;

  return (
    <LanguageContext.Provider value={accessibility.language as 'en' | 'hi' | 'bn' | 'ta'}>
    <DeviceFrame
      activeScreen={screen}
      setScreen={setScreen}
      screensList={screensList}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
    >
      {/* Active Screen Frame Renderer with custom state styling */}
      <div className={`w-full h-full flex flex-col relative transition-all ${activeStyleClasses} ${
        isDarkMode ? 'bg-slate-950 dark text-white' : 'bg-slate-50 text-slate-900'
      }`}>
        {kioskIdle && (
          <button className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 text-white text-xl" onClick={() => setKioskIdle(false)}>
            {t(accessibility.language, 'idle')}
          </button>
        )}
        
        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-hidden relative">
          {screen === 'splash' && (
            <SplashScreen 
              onComplete={() => setScreen('onboarding')} 
              isDarkMode={isDarkMode} 
            />
          )}

          {screen === 'onboarding' && (
            <OnboardingScreen 
              onComplete={() => setScreen('login')} 
              isDarkMode={isDarkMode} 
            />
          )}

          {screen === 'login' && (
            <LoginScreen 
              onLoginSuccess={handleLoginSuccess} 
              isDarkMode={isDarkMode} 
            />
          )}

          {screen === 'dashboard' && (
            <HomeDashboard
              userName={userName}
              isGuest={isGuest}
              isDarkMode={isDarkMode}
              language={accessibility.language as 'en' | 'hi' | 'bn' | 'ta'}
              onLanguageChange={(language) => setAccessibility((previous) => ({ ...previous, language }))}
              onSearchFocus={() => setScreen('assistant')}
              onQuickAction={handleQuickAction}
              onNavigateTrain={handleNavigateTrain}
              activeNotificationsCount={activeNotificationsCount}
              setScreen={setScreen}
            />
          )}

          {screen === 'map' && (
            <StationMap
              isDarkMode={isDarkMode}
              preselectedFilter={selectedMapFilter}
              preselectedRoute={selectedMapRoute}
              preselectedDestination={selectedMapDestination}
              onSpeak={(text) => handleSpeakText(text, true)}
              onStartNavigation={() => undefined}
            />
          )}

          {screen === 'assistant' && (
            <AIAssistant
              isDarkMode={isDarkMode}
              onSpeak={handleSpeakText}
              onNavigateToFacility={(fac) => {
                setSelectedMapFilter(fac);
                setSelectedMapRoute(false);
                setSelectedMapDestination(null);
                setScreen('map');
              }}
              onNavigateToPlace={(place) => {
                setSelectedMapDestination(place);
                setSelectedMapFilter('');
                setSelectedMapRoute(true);
                setScreen('map');
                handleSpeakText(`Starting navigation to ${place.label}. Follow the highlighted route.`, true);
              }}
            />
          )}

          {screen === 'platform' && (
            <PlatformDetails
              isDarkMode={isDarkMode}
              onStartNavigation={() => {
                setSelectedMapFilter('platforms');
                setSelectedMapRoute(true);
                setSelectedMapDestination(STATION_DESTINATIONS.find((item) => item.label === 'Platform 5') || null);
                setScreen('map');
                handleSpeakText('Starting navigation to Platform 5. Follow the highlighted route.', true);
              }}
            />
          )}

          {screen === 'emergency' && (
            <EmergencyScreen
              isDarkMode={isDarkMode}
              accessibility={accessibility}
              setAccessibility={setAccessibility}
              onSpeakText={handleSpeakText}
              onTriggerSOS={async (optionName) => {
                await triggerSOS({ stationId: 'ndls', floorId: 'GF', note: optionName });
              }}
            />
          )}

          {screen === 'notifications' && (
            <NotificationsScreen
              isDarkMode={isDarkMode}
              notifications={notifications}
              onMarkAllRead={handleMarkAllRead}
              onClearNotification={handleClearNotification}
              onNavigateToRoute={() => {
                setSelectedMapFilter('platforms');
                setSelectedMapRoute(true);
                setScreen('map');
                handleSpeakText('Starting navigation to Platform 5. Follow the highlighted route.', true);
              }}
            />
          )}

          {screen === 'profile' && (
            <ProfileScreen
              userName={userName}
              userPhone={userPhone}
              isGuest={isGuest}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              accessibility={accessibility}
              onLogout={handleLogout}
              setScreen={setScreen}
              screensList={screensList}
            />
          )}
        </div>

        {/* Dynamic Navigation Tab Bar (visible on all pages after Onboarding/Login screens) */}
        {!['splash', 'onboarding', 'login'].includes(screen) && (
          <div className={`h-16 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 shrink-0 z-20 shadow-lg ${
            isDarkMode ? 'bg-slate-950' : 'bg-white'
          }`}>
            {[
              { id: 'dashboard', label: t(accessibility.language, 'homeTab'), icon: <Home className="w-5 h-5" /> },
              { id: 'map', label: t(accessibility.language, 'mapTab'), icon: <Map className="w-5 h-5" /> },
              { id: 'assistant', label: t(accessibility.language, 'assistantTab'), icon: <MessageSquare className="w-5 h-5" /> },
              { id: 'platform', label: t(accessibility.language, 'platformTab'), icon: <Layers className="w-5 h-5" /> },
              { id: 'emergency', label: t(accessibility.language, 'emergencyTab'), icon: <ShieldAlert className="w-5 h-5" /> },
              { id: 'profile', label: t(accessibility.language, 'profileTab'), icon: <User className="w-5 h-5" /> }
            ].map((tab) => {
              const isActive = screen === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => {
                    setScreen(tab.id);
                    if (tab.id === 'map') {
                      // Reset filters so users see the default map when clicking from bottom tab
                      setSelectedMapFilter('');
                      setSelectedMapRoute(false);
                    }
                  }}
                  className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                  }`}
                >
                  {/* Decorative dot */}
                  {isActive && (
                    <span className="absolute top-0 w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  )}
                  {tab.icon}
                  <span className="text-[9px] font-medium tracking-tight mt-1">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DeviceFrame>
    </LanguageContext.Provider>
  );
}
