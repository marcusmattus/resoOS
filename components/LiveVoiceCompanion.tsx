'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NeuralLink } from '@/lib/resonances';
import { LiveBiometricPacket } from '@/lib/wearableService';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Bot, 
  User, 
  Send, 
  Radio, 
  MessageSquare,
  Waves
} from 'lucide-react';

interface LiveVoiceCompanionProps {
  activeLink: NeuralLink;
  biometrics: LiveBiometricPacket;
}

interface Message {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
}

export default function LiveVoiceCompanion({
  activeLink,
  biometrics,
}: LiveVoiceCompanionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'model',
      text: `Greetings. I am your ResOS Voice Guide powered by Gemini 3.8 Live. We are currently tuned to ${activeLink.name} at ${activeLink.primaryFrequencyHz} Hz. Your heart rate is ${biometrics.heartRate} BPM with ${biometrics.coherenceScore}% coherence. Speak or ask me anything to align your session.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // @ts-expect-error SpeechRecognition window object
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice speech synthesis helper
  const speakText = useCallback((text: string) => {
    if (!voiceSpeechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92; // Calm, meditative pace
    utterance.pitch = 0.98;
    const voices = window.speechSynthesis.getVoices();
    const calmingVoice = voices.find((v) => v.name.includes('Natural') || v.name.includes('Google') || v.lang.startsWith('en'));
    if (calmingVoice) utterance.voice = calmingVoice;
    window.speechSynthesis.speak(utterance);
  }, [voiceSpeechEnabled]);

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/gemini/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4),
          currentFrequency: activeLink.primaryFrequencyHz,
          bodyPart: activeLink.bodyPart,
          heartRate: biometrics.heartRate,
          hrv: biometrics.hrv,
        }),
      });

      const data = await res.json();
      const reply = data.text || 'I hear you. Focus on deep diaphragmatic exhalations to maximize harmonic entrainment.';

      const modelMsg: Message = {
        id: `m-${Date.now()}`,
        sender: 'model',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
      speakText(reply);
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'model',
        text: 'Connection interrupted. Breathe gently and synchronize with the active tone.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, isProcessing, messages, activeLink, biometrics, speakText]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        // @ts-expect-error SpeechRecognition webkit fallback
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: { results: { [x: string]: { [x: string]: { transcript: string } } } }) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            handleSendMessage(transcript);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [handleSendMessage]);

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your voice prompt.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white flex flex-col gap-4">
      {/* Voice Companion Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-950 border border-purple-800 text-purple-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100">ResOS Voice Companion</h3>
              <span className="text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
                gemini-3.8-live
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Real-time conversational frequency guide, biofield coaching, and breath pacing.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !voiceSpeechEnabled;
            setVoiceSpeechEnabled(next);
            if (!next && typeof window !== 'undefined') window.speechSynthesis?.cancel();
          }}
          className={`p-2 rounded-xl border text-xs transition-colors ${
            voiceSpeechEnabled
              ? 'bg-slate-800 text-cyan-400 border-cyan-800/60'
              : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
          title="Toggle Voice Audio Output"
        >
          {voiceSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Chat Messages Stream */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 h-56 overflow-y-auto flex flex-col gap-2.5 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'model' && (
              <div className="w-6 h-6 rounded-full bg-purple-950 border border-purple-700 flex items-center justify-center shrink-0 text-purple-300">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-2.5 rounded-2xl ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none'
              }`}
            >
              <p className="leading-relaxed">{m.text}</p>
              <span className="text-[9px] opacity-60 mt-1 block text-right font-mono">
                {m.timestamp}
              </span>
            </div>
            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-cyan-900 border border-cyan-700 flex items-center justify-center shrink-0 text-cyan-200">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span>ResOS Live Guide is synthesizing response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
        {[
          'Guide my breath pacing',
          `Why ${activeLink.primaryFrequencyHz} Hz for ${activeLink.bodyPart}?`,
          'How does this link increase vagal tone?',
          'Check my current coherence',
        ].map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field & Microphone Voice Capture */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleMic}
          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
            isListening
              ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
              : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
          }`}
          title={isListening ? 'Listening... click to stop' : 'Click to speak'}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <input
          type="text"
          placeholder={isListening ? 'Listening to your voice...' : 'Ask the ResOS Voice Guide or speak...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isProcessing}
          className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 transition-all shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
