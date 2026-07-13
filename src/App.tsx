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

export default function App() {
  // Mobile simulation state flow
  const [screen, setScreen] = useState<string>('splash');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Adharsh');
  const [userPhone, setUserPhone] = useState<string>('+91 9876543210');

  // Pre-configured simulation variables for cross-screen transitions
  const [selectedMapFilter, setSelectedMapFilter] = useState<string>('');
  const [selectedMapRoute, setSelectedMapRoute] = useState<boolean>(false);

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
  const handleSpeakText = (text: string) => {
    if (!accessibility.voiceGuidance) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel active speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech synthesis blocked by browser security guidelines:', e);
    }
  };

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

  // Handle Home Quick Actions to Map redirection
  const handleQuickAction = (actionId: string) => {
    let mapFilter = '';
    if (actionId === 'restroom') mapFilter = 'restrooms';
    if (actionId === 'food') mapFilter = 'food';
    if (actionId === 'lift') mapFilter = 'elevators';
    if (actionId === 'escalator') mapFilter = 'escalators';
    if (actionId === 'atm') mapFilter = 'atms';
    if (actionId === 'charging') mapFilter = 'charging';

    if (mapFilter) {
      setSelectedMapFilter(mapFilter);
      setSelectedMapRoute(false);
      setScreen('map');
      handleSpeakText(`Showing nearest ${mapFilter} layers on the station map.`);
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
    handleSpeakText(`Directing you to platform ${train.platform} for ${train.name}. Total distance is one hundred and eighty meters.`);
  };

  const handleLoginSuccess = (name: string, phone: string) => {
    setUserName(name);
    setUserPhone(phone);
    setUserLoggedIn(true);
    setScreen('dashboard');
    handleSpeakText(`Welcome to RailNav AI, ${name}. Your ticket details for NDLS Shatabdi Express are synchronized.`);
  };

  const handleLogout = () => {
    setUserLoggedIn(false);
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
              isDarkMode={isDarkMode}
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
              onStartNavigation={() => {
                handleSpeakText("Wayfinding started. Walk forward forty meters, then take the main escalator on your left to the overbridge.");
              }}
            />
          )}

          {screen === 'assistant' && (
            <AIAssistant
              isDarkMode={isDarkMode}
              onNavigateToFacility={(fac) => {
                setSelectedMapFilter(fac);
                setSelectedMapRoute(false);
                setScreen('map');
              }}
            />
          )}

          {screen === 'platform' && (
            <PlatformDetails
              isDarkMode={isDarkMode}
              onStartNavigation={() => {
                setSelectedMapFilter('platforms');
                setSelectedMapRoute(true);
                setScreen('map');
              }}
            />
          )}

          {screen === 'emergency' && (
            <EmergencyScreen
              isDarkMode={isDarkMode}
              accessibility={accessibility}
              setAccessibility={setAccessibility}
              onSpeakText={handleSpeakText}
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
              }}
            />
          )}

          {screen === 'profile' && (
            <ProfileScreen
              userName={userName}
              userPhone={userPhone}
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
              { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
              { id: 'map', label: 'Map', icon: <Map className="w-5 h-5" /> },
              { id: 'assistant', label: 'Copilot', icon: <MessageSquare className="w-5 h-5" /> },
              { id: 'platform', label: 'Platform', icon: <Layers className="w-5 h-5" /> },
              { id: 'emergency', label: 'Emergency', icon: <ShieldAlert className="w-5 h-5" /> },
              { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }
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
  );
}
