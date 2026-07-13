import React, { useState } from 'react';
import { Smartphone, Lock, ShieldCheck, Mail, Globe, ArrowLeft, Train } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (name: string, phone: string) => void;
  isDarkMode: boolean;
}

export default function LoginScreen({ onLoginSuccess, isDarkMode }: LoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      setIsOtpSent(true);
    }, 800);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpCode.join('');
    if (fullOtp.length < 4) {
      setErrorMessage('Please fill in the 4-digit verification code.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    // Simulate API verification
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess('Adharsh', '+91 ' + phoneNumber);
    }, 800);
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess('Adharsh', '+91 9876543210');
    }, 600);
  };

  const handleGuestSignIn = () => {
    onLoginSuccess('Guest Traveler', 'Unregistered Guest');
  };

  const handleOtpChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otpCode];
    newOtp[index] = val.slice(-1);
    setOtpCode(newOtp);

    // Auto focus next input
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div
      id="login-screen-container"
      className={`w-full h-full flex flex-col justify-between p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center gap-2">
        {isOtpSent && (
          <button
            id="btn-login-back"
            onClick={() => {
              setIsOtpSent(false);
              setOtpCode(['', '', '', '']);
              setErrorMessage('');
            }}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5 bg-blue-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-blue-100 dark:border-slate-800">
          <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">English</span>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 flex flex-col justify-center my-4 space-y-6">
        {/* Logo and Titles */}
        <div className="text-center space-y-1">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-md mb-2">
            <Train className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight font-sans">
            {isOtpSent ? 'Verify Number' : 'Welcome to RailNav'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {isOtpSent
              ? `We've sent a 4-digit code to +91 ${phoneNumber}`
              : 'Sign in to access interactive station maps and smart AI helpers'}
          </p>
        </div>

        {/* Form elements */}
        {!isOtpSent ? (
          <form id="form-phone-submit" onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label htmlFor="phone-number" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 dark:text-slate-400 select-none">
                  +91
                </span>
                <input
                  id="phone-number"
                  type="tel"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                  placeholder="Enter 10-digit number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-14 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-rose-500 text-left font-medium">{errorMessage}</p>
            )}

            <button
              id="btn-phone-submit"
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Request OTP Code'
              )}
            </button>
          </form>
        ) : (
          <form id="form-otp-submit" onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verification Code</label>
              <div className="flex justify-between gap-3 px-4">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="tel"
                    maxLength={1}
                    required
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && index > 0) {
                        const prevInput = document.getElementById(`otp-input-${index - 1}`);
                        prevInput?.focus();
                      }
                    }}
                    className="w-12 h-14 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:text-white"
                  />
                ))}
              </div>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-rose-500 text-left font-medium">{errorMessage}</p>
            )}

            <div className="space-y-2">
              <button
                id="btn-otp-submit"
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-emerald-green hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Verify & Login
                  </>
                )}
              </button>

              <button
                id="btn-resend-otp"
                type="button"
                onClick={() => {
                  setOtpCode(['', '', '', '']);
                  setErrorMessage('Code resent successfully.');
                }}
                className="w-full text-center text-[11px] font-bold text-blue-600 dark:text-blue-400 py-1.5"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Separator line */}
        <div className="flex items-center gap-3">
          <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-1"></div>
          <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-wider">or sign in with</span>
          <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-1"></div>
        </div>

        {/* Third Party Login Options */}
        <div className="space-y-2.5">
          <button
            id="btn-google-login"
            onClick={handleGoogleSignIn}
            className="w-full h-11 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2.5 text-xs font-bold transition"
          >
            {/* Minimal Google Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.95 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.27 7.55 8.9 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.8-.07-1.56-.2-2.27H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.63z"
              />
              <path
                fill="#FBBC05"
                d="M5.36 10.5C5.07 11.45 4.9 12.46 4.9 13.5s.17 2.05.46 3l-3.86 3C.56 17.5 0 15.56 0 13.5s.56-4 1.5-6l3.86 3z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.52 1.18-4.3 1.18-3.1 0-5.73-2.51-6.66-5.46l-3.86 3C3.4 20.35 7.35 23 12 23z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            id="btn-guest-login"
            onClick={handleGuestSignIn}
            className="w-full h-11 bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-slate-900 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition"
          >
            Continue as Guest
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[10px] text-slate-400 dark:text-slate-600 text-center leading-normal px-4">
        By continuing, you agree to the RailNav Terms of Service and Privacy Policy. All data is synchronized securely with Indian Railways.
      </div>
    </div>
  );
}
