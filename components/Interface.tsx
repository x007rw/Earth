import React, { useState, useEffect, useRef } from 'react';
import { Send, Globe, Settings, Info, Sparkles, Loader2, X, RefreshCw, Sun, Moon, Eye, EyeOff, Clock, Zap, RotateCw } from 'lucide-react';
import { sendMessageToGemini } from '../services/gemini';
import { ChatMessage, ChatRole, EarthConfig, DEFAULT_CONFIG } from '../types';

interface InterfaceProps {
  config: EarthConfig;
  setConfig: React.Dispatch<React.SetStateAction<EarthConfig>>;
}

const Interface: React.FC<InterfaceProps> = ({ config, setConfig }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: ChatRole.MODEL,
      text: "Orbital link established. I am ready to provide planetary analysis.",
      timestamp: Date.now()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  // UTC Clock
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        setUtcTime(now.toUTCString().split(' ')[4] + ' UTC');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: ChatRole.USER,
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await sendMessageToGemini(input, messages);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: ChatRole.MODEL,
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
       // Error handled in service
    } finally {
      setLoading(false);
    }
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const toggleRealTimeSun = () => {
    // If turning ON Sun Sync, turn OFF Earth Spin to avoid confusion/double movement
    setConfig(prev => ({
        ...prev,
        isRealTime: !prev.isRealTime,
        realTimeSpin: prev.isRealTime ? prev.realTimeSpin : false 
    }));
  };

  const toggleRealTimeSpin = () => {
    // If turning ON Earth Spin, turn OFF Sun Sync
    setConfig(prev => ({
        ...prev,
        realTimeSpin: !prev.realTimeSpin,
        isRealTime: prev.realTimeSpin ? prev.isRealTime : false,
        // Reset sun position to "Noon at Greenwich" angle (front) so rotation is relative to a fixed star
        sunPosition: !prev.realTimeSpin ? Math.PI : prev.sunPosition
    }));
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-10 font-sans">
      
      {/* Header / Status Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col animate-fade-in">
            <div className="flex items-center space-x-3 mb-1 backdrop-blur-md bg-black/20 p-2 pr-4 rounded-full border border-white/5">
                <div className="bg-cyan-500/10 p-1.5 rounded-full">
                  <Globe className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-[0.15em] text-white uppercase">Orbital View</h1>
                  <div className="flex items-center space-x-2 text-[10px] text-cyan-300/60 font-mono">
                    <span className="flex items-center"><span className="w-1 h-1 bg-green-500 rounded-full mr-1 animate-pulse"></span>LIVE FEED</span>
                    <span>v2.5.1</span>
                  </div>
                </div>
            </div>
        </div>

        <button 
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`p-3 rounded-full backdrop-blur-xl border transition-all duration-500 group ${
                settingsOpen 
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400 rotate-90 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                : 'bg-black/40 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/30'
            }`}
        >
            <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="absolute top-24 right-8 pointer-events-auto w-80 bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 p-6 text-sm animate-slide-in-right overflow-hidden z-50">
            
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-mono text-white/90 uppercase tracking-widest text-xs font-bold flex items-center">
                    <Settings className="w-3 h-3 mr-2 text-cyan-500"/>
                    System Config
                </h3>
                <button 
                    onClick={resetConfig} 
                    className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/30 transition-all"
                >
                    <RefreshCw className="w-3 h-3 text-white/40 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-[10px] font-bold uppercase text-white/60 group-hover:text-cyan-300">Default</span>
                </button>
            </div>
            
            <div className="space-y-7">
                {/* Time / Sun Position */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                         <div className="flex items-center text-xs font-bold text-white/80">
                            <Sun className="w-3 h-3 mr-2 text-yellow-500"/> Sun Position
                         </div>
                         
                         <button 
                            onClick={toggleRealTimeSun}
                            className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                                config.isRealTime 
                                ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                         >
                            <Clock className="w-3 h-3" />
                            <span>{config.isRealTime ? 'UTC Sync' : 'Manual'}</span>
                         </button>
                    </div>
                    
                    <input 
                        type="range" min="0" max={Math.PI * 2} step="0.01" 
                        value={config.sunPosition}
                        disabled={config.isRealTime}
                        onChange={(e) => setConfig({...config, sunPosition: parseFloat(e.target.value)})}
                        className={`w-full h-1 rounded-full appearance-none cursor-pointer transition-opacity ${config.isRealTime ? 'opacity-30 cursor-not-allowed' : 'opacity-100'} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_white]`}
                        style={{background: `linear-gradient(to right, #333, #333)`}}
                    />
                    {config.isRealTime && <div className="text-[9px] text-green-400 font-mono text-right">{utcTime}</div>}
                </div>

                {/* Rotation Speed */}
                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-white/80 items-center">
                        <span className="flex items-center"><RotateCw className="w-3 h-3 mr-2 text-cyan-500"/> Earth Rotation</span>
                        <button 
                            onClick={toggleRealTimeSpin}
                            className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                                config.realTimeSpin 
                                ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                         >
                            <Clock className="w-3 h-3" />
                            <span>{config.realTimeSpin ? 'Real-time' : 'Auto-Cam'}</span>
                         </button>
                    </div>
                    
                    {config.realTimeSpin ? (
                         <div className="w-full bg-white/5 rounded-lg p-2 flex justify-between items-center border border-white/5">
                            <span className="text-[9px] text-white/50 font-mono">SPIN: 1 REV / 24 HRS</span>
                            <span className="text-[9px] text-green-400 font-mono">{utcTime}</span>
                         </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <input 
                                type="range" min="0" max="2.0" step="0.1" 
                                value={config.rotationSpeed}
                                onChange={(e) => setConfig({...config, rotationSpeed: parseFloat(e.target.value)})}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_cyan]"
                            />
                            <span className="font-mono text-white/40 text-[10px] w-8 text-right">{(config.rotationSpeed * 100).toFixed(0)}%</span>
                        </div>
                    )}
                </div>

                {/* Mode Toggles */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setConfig({...config, highContrast: !config.highContrast})}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                            !config.highContrast 
                            ? 'bg-white/10 border-white/30 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]' 
                            : 'bg-black/40 border-white/5 text-white/40 hover:bg-white/5 hover:text-white/70'
                        }`}
                    >
                        {!config.highContrast ? <Sun className="w-5 h-5 mb-2 text-yellow-200"/> : <Moon className="w-5 h-5 mb-2"/>}
                        <span className="text-[10px] uppercase font-bold tracking-wider">{!config.highContrast ? 'Globe Mode' : 'Realistic'}</span>
                    </button>

                    <button 
                        onClick={() => setConfig({...config, showClouds: !config.showClouds})}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                            config.showClouds 
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]' 
                            : 'bg-black/40 border-white/5 text-white/40 hover:bg-white/5 hover:text-white/70'
                        }`}
                    >
                        {config.showClouds ? <Eye className="w-5 h-5 mb-2"/> : <EyeOff className="w-5 h-5 mb-2"/>}
                        <span className="text-[10px] uppercase font-bold tracking-wider">Clouds</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="flex justify-between items-end pointer-events-auto w-full">
        
        {/* System Info */}
        <div className="hidden md:block">
             <div className="group bg-black/20 backdrop-blur-md border border-white/5 hover:border-cyan-500/30 p-5 rounded-2xl text-xs font-mono text-white/50 max-w-xs transition-all duration-300">
                <div className="flex items-center mb-3 text-cyan-400/80 font-bold tracking-widest uppercase text-[10px]">
                    <Info className="w-3 h-3 mr-2"/> Status
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span>LIGHT_MODE:</span>
                        <span className={config.highContrast ? "text-white" : "text-yellow-200"}>{config.highContrast ? "ORBITAL" : "FLAT"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>SUN SYNC:</span>
                        <span className={config.isRealTime ? "text-green-400" : "text-white/30"}>{config.isRealTime ? "UTC LIVE" : "MANUAL"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>EARTH SPIN:</span>
                        <span className={config.realTimeSpin ? "text-green-400" : "text-white/30"}>{config.realTimeSpin ? "UTC LIVE" : "SIMULATED"}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Chat Interface */}
        <div className={`transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${chatOpen ? 'w-full md:w-[420px] h-[60vh] md:h-[650px]' : 'w-auto h-auto'}`}>
            {!chatOpen ? (
                <button 
                    onClick={() => setChatOpen(true)}
                    className="group relative flex items-center space-x-3 bg-white/5 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-950/30 rounded-full px-8 py-4 transition-all shadow-2xl shadow-black/50 overflow-hidden"
                >
                     <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-125 transition-transform duration-300" />
                    <span className="font-bold text-sm text-white/90 tracking-widest uppercase">Ask Orbital</span>
                </button>
            ) : (
                <div className="flex flex-col h-full bg-[#050505]/90 backdrop-blur-3xl border border-white/10 md:rounded-3xl rounded-t-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 relative">
                    {/* Decorative gradient blob */}
                    <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none"></div>

                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/5 relative z-10">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse"></div>
                                <div className="absolute top-0 left-0 w-full h-full bg-cyan-500 rounded-full animate-ping opacity-50"></div>
                            </div>
                            <span className="font-bold text-white font-mono text-xs tracking-[0.2em] uppercase">Orbital Guide</span>
                        </div>
                        <button onClick={() => setChatOpen(false)} className="text-white/30 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-hide relative z-10">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.role === ChatRole.USER ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm border transition-all hover:scale-[1.01] ${
                                    msg.role === ChatRole.USER 
                                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30 text-cyan-50 rounded-br-none' 
                                    : 'bg-white/5 border-white/10 text-gray-300 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                                <span className="text-[9px] text-white/20 font-mono mt-2 uppercase tracking-wider px-1">
                                    {msg.role === ChatRole.USER ? 'USER INPUT' : 'AI ANALYSIS'}
                                </span>
                            </div>
                        ))}
                        {loading && (
                             <div className="flex flex-col items-start animate-pulse">
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-bl-none flex items-center space-x-3">
                                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                                    <span className="text-xs text-cyan-400/80 font-mono">PROCESSING...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-5 border-t border-white/10 bg-black/40 relative z-10">
                        <div className="relative flex items-center group">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about Earth..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-5 pr-14 py-4 text-white text-sm focus:outline-none focus:border-cyan-500/40 focus:bg-white/10 transition-all placeholder-white/20 font-light group-hover:border-white/20"
                            />
                            <button 
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="absolute right-3 p-2 bg-cyan-500/10 hover:bg-cyan-500/30 rounded-lg text-cyan-400 transition-all disabled:opacity-30 disabled:scale-90 hover:scale-105 active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Interface;