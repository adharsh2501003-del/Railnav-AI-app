import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Mic, Compass, Sparkles, User, Play, 
  Square, Volume2, AlertCircle, HelpCircle, Loader2 
} from 'lucide-react';
import { ChatMessage } from '../types';
import { STATION_DESTINATIONS, StationDestination } from '../data';

interface AIAssistantProps {
  isDarkMode: boolean;
  onNavigateToFacility: (facilityId: string) => void;
  onNavigateToPlace?: (place: StationDestination) => void;
}

export default function AIAssistant({ isDarkMode, onNavigateToFacility, onNavigateToPlace }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: "Hi! How can I help you today? I can guide you to platforms, clean washrooms, food courts, or find wheelchair-friendly escalators and ramps.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  const quickSuggestions = [
    { text: 'Take me to Platform 8', id: 'platform_8' },
    { text: 'Nearest Restroom', id: 'restroom' },
    { text: 'Find Lift', id: 'lift' },
    { text: 'Food Court Nearby', id: 'food' },
    { text: 'Ticket Counter', id: 'ticket' },
    { text: 'Exit Gate', id: 'exit' },
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Connect to our server-side endpoint!
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: data.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error connecting to Gemini backend:', err);
      // Failover response
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: "I had a connection issue. Platform 8 is located on the First Floor overbridge. Take the escalator next to Gate A and go straight.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Simulate Voice input recording
  const handleToggleVoice = () => {
    if (isRecording) {
      // Stop recording and send a pre-selected phrase
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      setIsRecording(false);
      setRecordingSeconds(0);
      
      // Auto select a fun phrase
      const voiceOptions = [
        "Where is the nearest food court?",
        "Show me wheelchair elevator paths",
        "How do I reach Platform 8?"
      ];
      const selectedQuery = voiceOptions[Math.floor(Math.random() * voiceOptions.length)];
      handleSendMessage(selectedQuery);
    } else {
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 4) {
            // Auto stop after 4s
            if (recordingTimer.current) clearInterval(recordingTimer.current);
            setIsRecording(false);
            const voiceOptions = [
              "Where is the nearest food court?",
              "Show me wheelchair elevator paths",
              "How do I reach Platform 8?"
            ];
            handleSendMessage(voiceOptions[Math.floor(Math.random() * voiceOptions.length)]);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      id="chat-screen-container"
      className={`w-full h-full flex flex-col transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Mini Top Banner */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold leading-tight">RailNav Copilot</h3>
            <span className="text-[9px] text-emerald-green font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-green animate-ping"></span> Gemini Connected
            </span>
          </div>
        </div>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-full text-slate-400 font-bold uppercase tracking-wider">
          AI ASSIST
        </span>
      </div>

      {/* Messages Scroll Frame */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id}
              className={`flex items-start gap-2 max-w-[85%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isUser ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              </div>

              {/* Text Balloon */}
              <div className={`p-3 rounded-2xl text-xs leading-relaxed text-left ${
                isUser 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}

                {/* Map option shortcut cards within the chat box bubble */}
                {!isUser && (() => {
                  const matched = STATION_DESTINATIONS.filter(dest => {
                    const normalizedText = msg.text.toLowerCase();
                    if (normalizedText.includes(dest.label.toLowerCase())) return true;
                    return dest.keywords.some(kw => {
                      if (kw.length <= 3) {
                        const regex = new RegExp(`\\b${kw}\\b`, 'i');
                        return regex.test(msg.text);
                      }
                      return normalizedText.includes(kw);
                    });
                  });

                  if (matched.length === 0) return null;

                  return (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 animate-fadeIn">
                      <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 tracking-wider uppercase flex items-center gap-1">
                        <Compass className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
                        Map Option available
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {matched.map((place, pIdx) => (
                          <button
                            key={pIdx}
                            id={`btn-chat-map-link-${place.label.replace(/\s+/g, '-').toLowerCase()}`}
                            onClick={() => {
                              if (onNavigateToPlace) {
                                onNavigateToPlace(place);
                              } else {
                                onNavigateToFacility(place.type);
                              }
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-50/70 dark:bg-slate-950/75 border border-blue-100 dark:border-slate-800 hover:bg-blue-100 hover:border-blue-300 dark:hover:bg-slate-800 text-left font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer active:scale-98"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-[10px]">
                                {place.floor}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[10px] font-black truncate">{place.label}</h4>
                                <p className="text-[8px] text-slate-500 dark:text-slate-400 truncate font-medium">{place.details}</p>
                              </div>
                            </div>
                            <span className="text-[9px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm shrink-0 flex items-center gap-1 transition">
                              USE MAP ➔
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className={`text-[8px] font-mono mt-1 text-right ${isUser ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Skeleton Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-2 max-w-[85%] mr-auto">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>RailNav AI is analyzing station map...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips Panel */}
      {messages.length < 3 && !isTyping && (
        <div className="px-4 py-1 flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
          {quickSuggestions.map((s) => (
            <button
              key={s.id}
              id={`btn-chat-suggest-${s.id}`}
              onClick={() => handleSendMessage(s.text)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-semibold shrink-0 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            >
              {s.text}
            </button>
          ))}
        </div>
      )}

      {/* Voice Recording Overlay when active */}
      {isRecording && (
        <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 border-t border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 flex items-center justify-between shrink-0 animate-pulse">
          <div className="flex items-center gap-2 text-xs">
            <Mic className="w-4 h-4 text-rose-500 animate-bounce" />
            <span>Listening... Say "Platform 5 restroom" ({recordingSeconds}s)</span>
          </div>
          {/* Mock visual wave form bars */}
          <div className="flex gap-0.5 items-end h-5">
            {[4, 1, 5, 2, 6, 3, 5, 1].map((h, i) => (
              <span key={i} className="w-0.5 bg-rose-500 rounded-full" style={{ height: `${h * 3}px` }}></span>
            ))}
          </div>
        </div>
      )}

      {/* Input Message Footer Area */}
      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2 items-center shrink-0">
        {/* Glowing Voice Microphone FAB Button */}
        <button
          id="btn-chat-voice"
          onClick={handleToggleVoice}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all ${
            isRecording
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse'
              : 'bg-blue-50 dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-slate-800 hover:bg-blue-100 dark:hover:bg-slate-800'
          }`}
          title="Voice Search Helper"
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Text Input Box */}
        <input
          id="chat-text-input"
          type="text"
          placeholder="Ask RailNav AI a query..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
          className="flex-1 h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 dark:text-white"
        />

        {/* Send Button */}
        <button
          id="btn-chat-send"
          onClick={() => handleSendMessage(inputValue)}
          className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10 cursor-pointer transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
