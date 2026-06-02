import React, { useEffect, useState, useRef } from 'react';
import { useJarvisStore } from '../store/useStore';

interface VoiceWaveProps {
  sendMessage: (type: string, payload: any) => void;
  style?: React.CSSProperties;
}

export const VoiceWave: React.FC<VoiceWaveProps> = ({ sendMessage, style }) => {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  
  const addLog = useJarvisStore((state: any) => state.addLog);
  const voiceLanguage = useJarvisStore((state: any) => state.voiceLanguage);
  const setVoiceLanguage = useJarvisStore((state: any) => state.setVoiceLanguage);
  const lastTranscript = useJarvisStore((state: any) => state.lastTranscript);
  const interimTranscript = useJarvisStore((state: any) => state.interimTranscript);
  const setLastTranscript = useJarvisStore((state: any) => state.setLastTranscript);
  const setInterimTranscript = useJarvisStore((state: any) => state.setInterimTranscript);
  const setMicVolume = useJarvisStore((state: any) => state.setMicVolume);
  const voiceResponses = useJarvisStore((state: any) => state.voiceResponses);
  const setVoiceResponses = useJarvisStore((state: any) => state.setVoiceResponses);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const [frequencies, setFrequencies] = useState<number[]>(new Array(24).fill(6));

  // Synthesize futurist sound effects
  const playSound = (type: 'click' | 'power-on' | 'power-off' | 'success' | 'alert') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Auto-resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'power-on') {
        const times = [0, 0.05, 0.1];
        const freqs = [700, 950, 1300];
        times.forEach((t, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + t);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + t);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + t);
          osc.stop(ctx.currentTime + t + 0.08);
        });
      } else if (type === 'power-off') {
        const times = [0, 0.06];
        const freqs = [1000, 600];
        times.forEach((t, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + t);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + t);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + t);
          osc.stop(ctx.currentTime + t + 0.12);
        });
      } else if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'alert') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        osc.frequency.setValueAtTime(250, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      }
    } catch (e) {
      console.warn('Synth sound error:', e);
    }
  };

  const startListening = async () => {
    try {
      playSound('power-on');
      
      // 1. Setup Mic Capture for 3D/FFT audio waves
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; 
      analyserRef.current = analyser;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      setIsListening(true);
      isListeningRef.current = true;
      addLog('Local microphone audio stream initialized.', 'system');
      
      const updateWave = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        const freqs = Array.from(dataArrayRef.current).map(val => Math.max(4, (val / 255) * 60));
        setFrequencies(freqs.slice(0, 24)); // slice to match design size
        
        // Calculate average mic volume (0 to 100)
        const sum = freqs.reduce((acc, val) => acc + val, 0);
        const avg = sum / freqs.length;
        const volume = Math.min(100, Math.max(0, (avg - 4) * 2.2));
        setMicVolume(volume);
        
        animationFrameRef.current = requestAnimationFrame(updateWave);
      };
      
      updateWave();

      // 2. Setup Web Speech Recognition API
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = voiceLanguage;

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              currentFinal += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          
          if (currentFinal) {
            const cleaned = currentFinal.trim();
            if (cleaned) {
              playSound('success');
              addLog(`Voice command captured (${voiceLanguage}): "${cleaned}"`, 'ai');
              setLastTranscript(cleaned);
              setInterimTranscript('');
              sendMessage('voice_command', { text: cleaned });
            }
          } else if (currentInterim) {
            setInterimTranscript(currentInterim.trim());
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.error('Speech recognition error:', event.error);
            addLog(`Speech recognition error: ${event.error}`, 'error');
            playSound('alert');
          }
        };

        recognition.onend = () => {
          // Restart speech recognition automatically if still active
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // already running
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        addLog(`Speech recognition active in '${voiceLanguage}'.`, 'system');
      } else {
        addLog('Web Speech API is not supported in this browser. Voice commands disabled.', 'error');
      }

    } catch (err) {
      console.error('Error accessing microphone:', err);
      addLog('Failed to access microphone. Using simulated waves.', 'error');
      playSound('alert');
      simulateMicrophone();
    }
  };

  const simulateMicrophone = () => {
    setIsListening(true);
    isListeningRef.current = true;
    const updateSimulatedWave = () => {
      setFrequencies(prev => 
        prev.map(() => 4 + Math.random() * 36)
      );
      // Simulate random background hum for volume
      setMicVolume(10 + Math.random() * 20);
      animationFrameRef.current = requestAnimationFrame(updateSimulatedWave);
    };
    updateSimulatedWave();
  };

  const stopListening = () => {
    playSound('power-off');
    
    // Stop animations & mic stream
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // Stop speech recognition
    isListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);
    setFrequencies(new Array(24).fill(6));
    setMicVolume(0);
    setInterimTranscript('');
    addLog('Voice command engine paused.', 'info');
  };

  // Restart speech recognition if language is updated while listening
  useEffect(() => {
    if (isListening) {
      stopListening();
      setTimeout(() => {
        startListening();
      }, 200);
    }
  }, [voiceLanguage]);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '480px',
        height: '110px',
        zIndex: 10,
        padding: '12px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-neon-cyan)',
        borderBottom: '2px solid var(--color-accent-cyan)',
        borderRadius: '6px',
        ...style
      }}
    >
      {/* Top row: controls + visualizer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Microphone activation button */}
        <button
          onClick={isListening ? stopListening : startListening}
          title={isListening ? "Mute Voice Commands" : "Activate Voice Commands"}
          style={{
            background: 'none',
            border: isListening ? '1.5px solid var(--color-accent-green)' : '1px solid rgba(0, 255, 255, 0.4)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isListening ? 'var(--color-accent-green)' : 'var(--color-accent-cyan)',
            boxShadow: isListening ? 'var(--shadow-neon-green)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <svg 
            viewBox="0 0 24 24" 
            width="20" 
            height="20" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        {/* SVG Waveform Graphic */}
        <div style={{ flex: 1, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', margin: '0 15px' }}>
          {frequencies.map((height, idx) => (
            <div
              key={idx}
              style={{
                width: '5px',
                height: `${height}px`,
                backgroundColor: isListening ? 'var(--color-accent-cyan)' : 'var(--color-accent-blue)',
                opacity: isListening ? 0.95 : 0.25,
                borderRadius: '3px',
                transition: 'height 0.05s ease, background-color 0.3s ease',
                boxShadow: isListening ? '0 0 6px rgba(0, 255, 255, 0.4)' : 'none'
              }}
            />
          ))}
        </div>
        
        {/* Language selector & status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* TTS Speech Toggle */}
            <button
              onClick={() => {
                playSound('click');
                setVoiceResponses(!voiceResponses);
              }}
              title={voiceResponses ? "Mute J.A.R.V.I.S. voice feedback" : "Unmute J.A.R.V.I.S. voice feedback"}
              style={{
                background: 'rgba(0, 255, 255, 0.02)',
                border: '1px solid ' + (voiceResponses ? 'rgba(0, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'),
                borderRadius: '4px',
                padding: '3px 8px',
                color: voiceResponses ? 'var(--color-accent-cyan)' : 'var(--color-text-dim)',
                cursor: 'pointer',
                fontFamily: 'Orbitron',
                fontSize: '10px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>🔊 VOICE</span>
              <span style={{ 
                color: voiceResponses ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
                fontWeight: 'bold',
                textShadow: voiceResponses ? '0 0 5px rgba(0, 255, 65, 0.5)' : 'none'
              }}>
                {voiceResponses ? 'ON' : 'OFF'}
              </span>
            </button>

            <select
              value={voiceLanguage}
              onChange={(e) => {
                playSound('click');
                setVoiceLanguage(e.target.value);
              }}
              className="cyber-input"
              style={{
                padding: '2px 8px',
                fontSize: '10px',
                fontFamily: 'Orbitron',
                color: 'var(--color-accent-cyan)',
                background: 'rgba(0, 5, 15, 0.7)',
                borderColor: 'rgba(0, 255, 255, 0.3)',
                cursor: 'pointer'
              }}
            >
              <option value="en-US">English (US)</option>
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (हिन्दी)</option>
            </select>
          </div>
          
          <div style={{ fontFamily: 'Orbitron', fontSize: '9px', color: isListening ? 'var(--color-accent-green)' : 'var(--color-text-dim)', letterSpacing: '0.5px' }}>
            {isListening ? 'SPEECH ACTIVE' : 'MIC INACTIVE'}
          </div>
        </div>
      </div>

      {/* Real-time speech display */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '28px',
          background: 'rgba(0, 3, 10, 0.5)',
          border: '1px solid rgba(0, 255, 255, 0.1)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 10px',
          overflow: 'hidden'
        }}
      >
        <span 
          style={{ 
            fontFamily: 'monospace', 
            fontSize: '11px', 
            color: 'var(--color-accent-cyan)',
            textAlign: 'center',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            width: '100%'
          }}
        >
          {interimTranscript ? (
            <span style={{ color: 'rgba(0, 255, 255, 0.65)', fontStyle: 'italic' }}>
              🎤 &ldquo;{interimTranscript}...&rdquo;
            </span>
          ) : lastTranscript ? (
            <span style={{ color: '#fff', textShadow: '0 0 8px rgba(0, 255, 255, 0.6)' }}>
              &ldquo;{lastTranscript}&rdquo;
            </span>
          ) : (
            <span style={{ color: 'var(--color-text-dim)' }}>
              Commands: &ldquo;open terminal&rdquo;, &ldquo;open browser&rdquo;, &ldquo;scroll down&rdquo;
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
