import React, { useState } from 'react';
import { Train, MessageSquare, Route, MapPin, Compass, Search, HelpCircle, ArrowRight } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
  isDarkMode: boolean;
}

export default function OnboardingScreen({ onComplete, isDarkMode }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);

  const onboardingSteps = [
    {
      title: 'Find Your Platform',
      tagline: 'Platform Navigation Made Simple',
      description: 'Get instant platform locations, delay updates, and direct coach layout information for your specific train without getting lost.',
      icon: <Train className="w-16 h-16 text-blue-600 dark:text-blue-400" />,
      illustration: (
        <div className="relative w-full h-44 bg-blue-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center overflow-hidden border border-blue-100/40 dark:border-slate-800">
          {/* Platform Mock Graphics */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-slate-300 dark:bg-slate-800 flex items-center px-4 border-t border-slate-400 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400 font-mono text-xs font-bold">PLATFORM 5</span>
            <div className="ml-auto flex gap-1">
              {['S1', 'S2', 'S3', 'M1', 'A1'].map((c, i) => (
                <span key={i} className="text-[9px] px-1 bg-blue-600 text-white rounded font-bold">{c}</span>
              ))}
            </div>
          </div>
          <div className="absolute top-4 left-6 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-green animate-ping"></div>
            <span className="text-xs font-medium dark:text-white">Train 12626 Kerala Exp</span>
          </div>
          <div className="absolute top-16 right-6 p-2.5 bg-blue-600 text-white rounded-xl shadow-md flex items-center gap-1.5 text-xs font-semibold animate-pulse">
            <MapPin className="w-4 h-4" /> Go to Plat 5
          </div>
        </div>
      )
    },
    {
      title: 'Smart AI Assistant',
      tagline: 'Your Friendly Station Guide',
      description: 'Need to find a water dispenser, food stall, or elevator? Just ask our multilingual AI assistant. Powered by Gemini, it guides you instantly.',
      icon: <MessageSquare className="w-16 h-16 text-emerald-green" />,
      illustration: (
        <div className="relative w-full h-44 bg-emerald-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center overflow-hidden border border-emerald-100/40 dark:border-slate-800">
          {/* Chat bubbles illustration */}
          <div className="absolute left-4 top-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-2xl rounded-tl-none shadow-sm max-w-[200px]">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Where is the nearest wheelchair lift?</p>
          </div>
          <div className="absolute right-4 bottom-10 bg-emerald-600 text-white p-2.5 rounded-2xl rounded-br-none shadow-md max-w-[200px]">
            <p className="text-[10px] font-medium">Nearest Lift is next to Platform 3 entrance, 45m away.</p>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700">
            <Compass className="w-5 h-5 text-emerald-green animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>
      )
    },
    {
      title: 'Navigate with Ease',
      tagline: 'Interactive Multi-Floor Maps',
      description: 'View real-time station heatmaps, select floors, track your blue-dot location, and follow wheel-chair friendly routes with zero effort.',
      icon: <Route className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />,
      illustration: (
        <div className="relative w-full h-44 bg-indigo-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center overflow-hidden border border-indigo-100/40 dark:border-slate-800">
          {/* Indoor map path illustration */}
          <svg className="absolute inset-0 w-full h-full stroke-indigo-200 dark:stroke-slate-800 stroke-2" fill="none">
            <path d="M 50,40 L 150,40 L 150,110 L 300,110" />
            <path d="M 150,110 L 150,160 L 220,160" />
          </svg>
          {/* Animated path */}
          <svg className="absolute inset-0 w-full h-full stroke-indigo-600 dark:stroke-indigo-400 stroke-[3] stroke-dasharray-[6]" fill="none">
            <path d="M 50,40 L 150,40 L 150,110 L 300,110" className="animate-pulse" />
          </svg>
          <div className="absolute left-[45px] top-[35px] w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md animate-ping"></div>
          <div className="absolute left-[45px] top-[35px] w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>
          
          <div className="absolute left-[285px] top-[95px] p-1.5 bg-rose-500 text-white rounded-lg shadow-sm flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          
          <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full">FLOOR 1</span>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div
      id="onboarding-screen-container"
      className={`w-full h-full flex flex-col justify-between p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
      }`}
    >
      {/* Header Utilities */}
      <div className="flex justify-between items-center h-8">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">RailNav AI</span>
        {step < onboardingSteps.length - 1 ? (
          <button
            id="btn-onboard-skip"
            onClick={onComplete}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            Skip
          </button>
        ) : null}
      </div>

      {/* Main Illustration and Description Content */}
      <div className="flex-1 flex flex-col justify-center my-6">
        {/* Render Step-Specific Illustration */}
        <div className="mb-6">{onboardingSteps[step].illustration}</div>

        {/* Text Details */}
        <div className="space-y-2 text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-green">
            {onboardingSteps[step].tagline}
          </span>
          <h2 className="text-2xl font-bold tracking-tight font-sans text-slate-900 dark:text-white">
            {onboardingSteps[step].title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            {onboardingSteps[step].description}
          </p>
        </div>
      </div>

      {/* Footer Navigation Controls */}
      <div className="space-y-5">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-1.5">
          {onboardingSteps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-slate-800'
              }`}
            ></span>
          ))}
        </div>

        {/* Next/Get Started Button */}
        <button
          id={`btn-onboard-next-${step}`}
          onClick={handleNext}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all duration-200 cursor-pointer"
        >
          {step === onboardingSteps.length - 1 ? (
            <>
              Get Started <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            'Next'
          )}
        </button>
      </div>
    </div>
  );
}
