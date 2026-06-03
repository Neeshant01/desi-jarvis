import { useEffect, useRef, useCallback } from 'react';
import { useJarvisStore } from '../store/useStore';

const isHinglishText = (text: string): boolean => {
  const hinglishWords = [
    'hai', 'hoon', 'hu', 'ho', 'karo', 'karein', 'kijiye', 'kholo', 'band', 'chaloo', 'chalu',
    'kaise', 'kya', 'kyun', 'kyu', 'kab', 'kaha', 'kahan', 'kidhar', 'ap', 'aap', 'tum', 'tu',
    'shukriya', 'dhanyawad', 'namaste', 'acha', 'achha', 'mausam', 'samay', 'waqt', 'naam', 'nam',
    'kaam', 'kam', 'sirf', 'bahut', 'bohot', 'sahi', 'galat', 'thik', 'theek', 'haan', 'han', 'na',
    'nahi', 'nahin', 'mat', 'kar', 'raha', 'rahe', 'rahi', 'gaya', 'gaye', 'gayi', 'kiya', 'kiye',
    'liye', 'ko', 'se', 'ka', 'ki', 'ke', 'aur', 'ya', 'par', 'pe'
  ];
  const words = text.toLowerCase().split(/\s+/);
  return words.some(word => hinglishWords.includes(word));
};

const containsDevanagari = (text: string): boolean => {
  return /[\u0900-\u097F]/.test(text);
};

const speakJarvis = (text: string) => {
  try {
    if (!window.speechSynthesis) return;
    
    let cleanText = text;
    if (text.startsWith("J.A.R.V.I.S.:")) {
      cleanText = text.replace("J.A.R.V.I.S.:", "").trim();
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const store = useJarvisStore.getState();
    const storeLang = store.voiceLanguage || 'en-US';
    
    // Auto-detect language style
    let speakLang = storeLang;
    if (containsDevanagari(cleanText)) {
      speakLang = 'hi-IN';
    } else if (isHinglishText(cleanText)) {
      speakLang = 'en-IN';
    }
    
    utterance.lang = speakLang;
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    // Prioritize Indian accent voices (Hindi or Indian English) to sound "ekdam Indian human-like"
    if (speakLang.startsWith('hi')) {
      selectedVoice = voices.find(v => v.lang.toLowerCase().includes('hi-in') || v.lang.toLowerCase().startsWith('hi'));
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().startsWith('en-in'));
      }
    } else {
      // Standard English: Prioritize Indian English (en-IN) then Hindi (hi-IN) for the desired human-like accent
      selectedVoice = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().startsWith('en-in'));
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.toLowerCase().includes('hi-in') || v.lang.toLowerCase().startsWith('hi'));
      }
    }
    
    // Fallback to British English male voice for standard J.A.R.V.I.S. tone if no Indian voice is installed
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('male'));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en-GB'));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith(speakLang.split('-')[0]));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Adjust pitch and rate for natural sound
    const isIndianVoice = selectedVoice && (selectedVoice.lang.toLowerCase().includes('in') || selectedVoice.lang.toLowerCase().startsWith('hi'));
    if (isIndianVoice) {
      utterance.pitch = 1.0;
      utterance.rate = 0.90; // Natural, clear cadence for Indian accents
    } else {
      utterance.pitch = 0.95; // Sophisticated British male tone
      utterance.rate = 1.02;  // Clean British accent speed
    }
    utterance.volume = 1.0;
    
    utterance.onerror = (event) => {
      console.warn('SpeechSynthesisUtterance play error:', event.error);
    };
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
};

// Warm up speech synthesis voices
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

const speakSystem = (text: string) => {
  try {
    if (!window.speechSynthesis) return;
    if (!useJarvisStore.getState().voiceResponses) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose a female voice for system alerts/status messages
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'));
    if (!selectedVoice) {
      selectedVoice = voices.find(v => !v.name.toLowerCase().includes('male') && v.lang.startsWith('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.pitch = 1.1; // Higher pitch for status reports
    utterance.rate = 1.05; // Slightly faster pacing
    utterance.volume = 0.75; // Quieter than J.A.R.V.I.S.
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('System speech error:', e);
  }
};

const playBase64Audio = (base64Audio: string) => {
  try {
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(err => {
      console.warn("Audio play blocked by browser:", err);
    });
  } catch (e) {
    console.error("Failed to play base64 audio:", e);
  }
};

export const useSocket = (url: string = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws') => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const maxReconnectRetries = 5;
  const lastPlayedAudioTextRef = useRef<string>("");
  const latencyTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const setStatus = useJarvisStore((state: any) => state.setStatus);
  const updateMetrics = useJarvisStore((state: any) => state.updateMetrics);
  const addLog = useJarvisStore((state: any) => state.addLog);
  const setScreenFrame = useJarvisStore((state: any) => state.setScreenFrame);
  const setBrowserState = useJarvisStore((state: any) => state.setBrowserState);
  const setIsProcessing = useJarvisStore((state: any) => state.setIsProcessing);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus('reconnecting');
    addLog(reconnectCountRef.current > 0 
      ? `Reconnecting to server... (Attempt ${reconnectCountRef.current}/${maxReconnectRetries})` 
      : 'Connecting to J.A.R.V.I.S. system core...', 
      'info'
    );

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      reconnectCountRef.current = 0;
      addLog('Secure communication bridge established.', 'system');
      speakSystem('System core bridge established.');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        switch (type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', payload: {} }));
            break;
          case 'voice_audio_failed':
            if (useJarvisStore.getState().voiceResponses) {
              speakJarvis(payload.text);
            }
            break;
          case 'voice_audio':
            // 1. Mark that we are playing ElevenLabs audio to prevent client-side TTS
            lastPlayedAudioTextRef.current = payload.text;
            playBase64Audio(payload.audio);
            break;
          case 'info':
            if (latencyTimerRef.current) {
              clearTimeout(latencyTimerRef.current);
              latencyTimerRef.current = null;
            }
            setIsProcessing(false);
            addLog(payload.message || 'Information packet received.', 'info');
            if (payload.message && payload.message.startsWith('J.A.R.V.I.S.:')) {
              if (useJarvisStore.getState().voiceResponses) {
                if (payload.skip_local_tts) {
                  // Backend will send high-quality audio shortly, do not use browser TTS
                } else {
                  const cleanText = payload.message.replace("J.A.R.V.I.S.:", "").trim();
                  // Check if this text was just played via ElevenLabs/EdgeTTS audio
                  if (lastPlayedAudioTextRef.current === cleanText) {
                    // Reset reference and skip client-side synthesis
                    lastPlayedAudioTextRef.current = "";
                  } else {
                    speakJarvis(payload.message);
                  }
                }
              }
            }
            break;
          case 'metrics':
            updateMetrics(payload);
            break;
          case 'screen_frame':
            setScreenFrame(payload.image);
            break;
          case 'browser_state':
            setBrowserState({
              status: payload.status,
              screenshot: payload.screenshot || '',
              url: payload.url || ''
            });
            addLog(`Browser updated: ${payload.status} ${payload.url ? `(${payload.url})` : ''}`, 'system');
            speakSystem(`Browser status: ${payload.status}`);
            break;
          case 'HUMAN_REQUIRED':
            setBrowserState({
              status: 'paused_for_captcha',
              screenshot: payload.screenshot || ''
            });
            addLog(`⚠️ ALERT: ${payload.message}`, 'error');
            speakSystem("Verification challenge detected. Sir, attention required.");
            break;
          case 'action_result':
            if (latencyTimerRef.current) {
              clearTimeout(latencyTimerRef.current);
              latencyTimerRef.current = null;
            }
            setIsProcessing(false);
            if (payload.success) {
              addLog(`Command successfully executed: ${payload.action}`, 'system');
              if (!payload.action.startsWith('voice_command')) {
                speakSystem(`Action completed: ${payload.action}`);
              }
            } else {
              addLog(`⚠️ Command failed: ${payload.action}`, 'error');
              if (!payload.action.startsWith('voice_command')) {
                speakSystem(`Warning: action failed: ${payload.action}`);
              }
            }
            break;
          default:
            // Custom unhandled types
            break;
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };

    ws.onclose = (event) => {
      setStatus('disconnected');
      socketRef.current = null;
      
      if (reconnectCountRef.current < maxReconnectRetries) {
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 15000);
        reconnectCountRef.current += 1;
        addLog(`Connection closed: ${event.reason || 'Server offline'}. Retrying in ${(delay/1000).toFixed(1)}s...`, 'error');
        speakSystem('Bridge lost. Reconnecting.');
        setTimeout(connect, delay);
      } else {
        addLog('Max reconnection retries reached. Click reconnect to try again.', 'error');
        speakSystem('Bridge connection offline.');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [url, setStatus, addLog, updateMetrics, setScreenFrame, setBrowserState]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      if (type === 'voice_command') {
        setIsProcessing(true);
        if (latencyTimerRef.current) clearTimeout(latencyTimerRef.current);
        latencyTimerRef.current = setTimeout(() => {
          addLog('⚠️ Warning: Connection latency detected. AI model processing is taking longer than expected.', 'error');
          speakSystem('Warning: Connection latency detected. The A I model is taking longer than expected to respond.');
        }, 10000);
      }
      
      socketRef.current.send(JSON.stringify({
        type,
        payload,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now()
      }));
    } else {
      addLog('Cannot send command. Core bridge disconnected.', 'error');
    }
  }, [addLog]);

  return { sendMessage, reconnect: connect };
};
