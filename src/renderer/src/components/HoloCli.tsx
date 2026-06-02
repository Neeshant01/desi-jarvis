import React, { useState, useEffect, useRef } from 'react';
import { useJarvisStore } from '../store/useStore';

interface HoloCliProps {
  sendMessage: (type: string, payload: any) => void;
  style?: React.CSSProperties;
}

export const HoloCli: React.FC<HoloCliProps> = ({ sendMessage, style }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const addLog = useJarvisStore((state: any) => state.addLog);
  const isProcessing = useJarvisStore((state: any) => state.isProcessing);
 
  // Play click/beep sounds
  const playSound = (type: 'click' | 'success' | 'alert') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Auto-resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      } else if (type === 'alert') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      }
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Audio blocked or unsupported
    }
  };

  // Keyboard shortcut listener to focus CLI with '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus if '/' is pressed and user is not in an input/textarea
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        playSound('click');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    const cmd = command.trim();
    if (!cmd) return;

    playSound('success');
    addLog(`CLI command dispatched: "${cmd}"`, 'info');
    
    // Send to server as voice_command payload
    sendMessage('voice_command', { text: cmd });

    // Append to history
    setHistory(prev => [cmd, ...prev.slice(0, 19)]);
    setHistoryIndex(-1);
    setCommand('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
        playSound('click');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
        playSound('click');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
        playSound('click');
      }
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
      playSound('click');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '420px',
        width: 'calc(100vw - 860px)',
        height: '60px',
        zIndex: 10,
        padding: '0 15px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'var(--shadow-neon-cyan)',
        borderBottom: '2px solid var(--color-accent-cyan)',
        borderRadius: '6px',
        transform: 'perspective(1000px) rotateX(5deg)',
        ...style
      }}
    >
      {/* Icon prompt indicator */}
      <span style={{ 
        fontFamily: 'Orbitron', 
        fontSize: '14px', 
        color: 'var(--color-accent-cyan)', 
        fontWeight: 'bold',
        textShadow: '0 0 5px rgba(0, 255, 255, 0.5)',
        whiteSpace: 'nowrap'
      }}>
        ⚡ J.A.R.V.I.S. &gt;
      </span>

      {/* Input textbox */}
      <input
        ref={inputRef}
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Enter system command... (e.g. 'open terminal', 'navigate to youtube.com', press '/' to focus)"
        disabled={isProcessing}
        className="cyber-input"
        style={{
          flex: 1,
          fontFamily: 'monospace',
          fontSize: '12px',
          height: '38px',
          background: isProcessing ? 'rgba(0, 5, 12, 0.4)' : 'rgba(0, 5, 12, 0.8)',
          border: '1px solid rgba(0, 255, 255, 0.25)',
          color: isProcessing ? 'var(--color-text-dim)' : '#fff',
          outline: 'none',
          boxShadow: 'none',
          transition: 'all 0.3s ease'
        }}
      />

      <button
        type="submit"
        disabled={isProcessing}
        className={`cyber-button ${isProcessing ? 'processing' : ''}`}
        style={{
          height: '38px',
          padding: '0 20px',
          fontSize: '10px',
          border: isProcessing ? '1px solid var(--color-accent-amber)' : '1px solid var(--color-accent-cyan)',
          color: isProcessing ? 'var(--color-accent-amber)' : 'var(--color-accent-cyan)',
          boxShadow: isProcessing ? '0 0 10px rgba(255, 170, 0, 0.3)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        {isProcessing ? 'PROCESSING...' : 'EXECUTE'}
      </button>
    </form>
  );
};
