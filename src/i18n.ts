export type Language = 'en' | 'hi' | 'bn';

export const dictionary: Record<Language, Record<string, string>> = {
  en: { home: 'Home', map: 'Station Map', notifications: 'Notifications', route: 'Route', idle: 'Touch the screen to continue' },
  hi: { home: 'होम', map: 'स्टेशन मानचित्र', notifications: 'सूचनाएं', route: 'मार्ग', idle: 'जारी रखने के लिए स्क्रीन छुएं' },
  bn: { home: 'হোম', map: 'স্টেশন মানচিত্র', notifications: 'বিজ্ঞপ্তি', route: 'রুট', idle: 'চালিয়ে যেতে স্ক্রিন স্পর্শ করুন' },
};

export function t(language: string, key: string): string {
  return (dictionary[(language as Language)] || dictionary.en)[key] || dictionary.en[key] || key;
}
