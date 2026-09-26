import { createContext, useContext } from 'react';

export type Language = 'en' | 'hi' | 'bn' | 'ta';

export const dictionary: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home', map: 'Station Map', notifications: 'Notifications', route: 'Route',
    idle: 'Touch the screen to continue', welcome: 'Welcome back', going: 'Where are you going today?',
    quickActions: 'Quick Actions', language: 'Language', search: 'Search platform, restroom, food court...',
    homeTab: 'Home', mapTab: 'Map', assistantTab: 'Copilot', platformTab: 'Platform', emergencyTab: 'Emergency', profileTab: 'Profile',
    notificationsTab: 'Notifications', stationMap: 'Station Map', aiAssistant: 'AI Assistant', platformDetails: 'Platform Details',
    emergencyAccess: 'Emergency & Accessibility', passengerProfile: 'Passenger Profile',
    stationComplex: 'New Delhi Station Complex', platformOperations: 'Platform Operations', startNavigation: 'Start Navigation',
    resetNavigation: 'Reset Navigation & Wayfinding', readAloud: 'Read response aloud',
  },
  hi: {
    home: 'होम', map: 'स्टेशन मानचित्र', notifications: 'सूचनाएं', route: 'मार्ग',
    idle: 'जारी रखने के लिए स्क्रीन छुएं', welcome: 'वापसी पर स्वागत है', going: 'आज आप कहाँ जा रहे हैं?',
    quickActions: 'त्वरित कार्य', language: 'भाषा', search: 'प्लेटफ़ॉर्म, शौचालय, फूड कोर्ट खोजें...',
    homeTab: 'होम', mapTab: 'मानचित्र', assistantTab: 'सहायक', platformTab: 'प्लेटफ़ॉर्म', emergencyTab: 'आपातकाल', profileTab: 'प्रोफ़ाइल',
    notificationsTab: 'सूचनाएं', stationMap: 'स्टेशन मानचित्र', aiAssistant: 'एआई सहायक', platformDetails: 'प्लेटफ़ॉर्म विवरण',
    emergencyAccess: 'आपातकाल और सुगम्यता', passengerProfile: 'यात्री प्रोफ़ाइल', platformOperations: 'प्लेटफ़ॉर्म संचालन',
    startNavigation: 'नेविगेशन शुरू करें', resetNavigation: 'नेविगेशन रीसेट करें', readAloud: 'उत्तर सुनें',
  },
  bn: {
    home: 'হোম', map: 'স্টেশন মানচিত্র', notifications: 'বিজ্ঞপ্তি', route: 'রুট',
    idle: 'চালিয়ে যেতে স্ক্রিন স্পর্শ করুন', welcome: 'আবার স্বাগতম', going: 'আজ আপনি কোথায় যাচ্ছেন?',
    quickActions: 'দ্রুত কাজ', language: 'ভাষা', search: 'প্ল্যাটফর্ম, শৌচাগার, ফুড কোর্ট খুঁজুন...',
    homeTab: 'হোম', mapTab: 'মানচিত্র', assistantTab: 'সহায়ক', platformTab: 'প্ল্যাটফর্ম', emergencyTab: 'জরুরি', profileTab: 'প্রোফাইল',
    notificationsTab: 'বিজ্ঞপ্তি', stationMap: 'স্টেশন মানচিত্র', aiAssistant: 'এআই সহায়ক', platformDetails: 'প্ল্যাটফর্মের বিবরণ',
    emergencyAccess: 'জরুরি ও অ্যাক্সেসিবিলিটি', passengerProfile: 'যাত্রী প্রোফাইল', platformOperations: 'প্ল্যাটফর্ম পরিচালনা',
    startNavigation: 'নেভিগেশন শুরু করুন', resetNavigation: 'নেভিগেশন রিসেট করুন', readAloud: 'উত্তর শুনুন',
  },
  ta: {
    home: 'முகப்பு', map: 'நிலைய வரைபடம்', notifications: 'அறிவிப்புகள்', route: 'வழித்தடம்',
    idle: 'தொடர திரையைத் தொடவும்', welcome: 'மீண்டும் வரவேற்கிறோம்', going: 'இன்று எங்கு செல்ல வேண்டும்?',
    quickActions: 'விரைவு செயல்கள்', language: 'மொழி', search: 'பிளாட்ஃபார்ம், கழிப்பறை, உணவகத்தைத் தேடுங்கள்...',
    homeTab: 'முகப்பு', mapTab: 'வரைபடம்', assistantTab: 'உதவியாளர்', platformTab: 'பிளாட்ஃபார்ம்', emergencyTab: 'அவசரம்', profileTab: 'சுயவிவரம்',
    notificationsTab: 'அறிவிப்புகள்', stationMap: 'நிலைய வரைபடம்', aiAssistant: 'ஏஐ உதவியாளர்', platformDetails: 'பிளாட்ஃபார்ம் விவரங்கள்',
    emergencyAccess: 'அவசரம் மற்றும் அணுகல்தன்மை', passengerProfile: 'பயணி சுயவிவரம்', platformOperations: 'பிளாட்ஃபார்ம் செயல்பாடுகள்',
    startNavigation: 'வழிகாட்டலைத் தொடங்கவும்', resetNavigation: 'வழிகாட்டலை மீட்டமைக்கவும்', readAloud: 'பதிலை உரக்கப் படிக்கவும்',
  },
};

export function t(language: string, key: string): string {
  return (dictionary[(language as Language)] || dictionary.en)[key] || dictionary.en[key] || key;
}

export const LanguageContext = createContext<Language>('en');

export function useLanguage(): Language {
  return useContext(LanguageContext);
}
