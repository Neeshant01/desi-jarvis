import React, { useEffect, useRef } from 'react';
import { useJarvisStore } from '../store/useStore';

interface HoloTerminalProps {
  style?: React.CSSProperties;
}

export const HoloTerminal: React.FC<HoloTerminalProps> = ({ style }) => {
  const logs = useJarvisStore((state) => state.terminalLogs);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '380px',
        height: '240px',
        zIndex: 10,
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        fontSize: '12px',
        transform: 'perspective(1000px) rotateY(10deg) rotateX(5deg)',
        borderLeft: '3px solid var(--color-accent-cyan)',
        boxShadow: 'var(--shadow-neon-cyan)',
        ...style
      }}
    >
      {/* Title Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderBottom: '1px solid rgba(0, 255, 255, 0.15)',
        paddingBottom: '8px',
        marginBottom: '10px',
        color: 'var(--color-accent-cyan)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: 'bold'
      }}>
        <span>System Diagnostics Console</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-accent-cyan)' }}></span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-accent-blue)' }}></span>
        </div>
      </div>

      {/* Logs Window */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '5px'
        }}
      >
        {logs.map((log) => {
          let color = '#fff';
          if (log.type === 'system') color = 'var(--color-accent-green)';
          if (log.type === 'ai') color = 'var(--color-accent-cyan)';
          if (log.type === 'error') color = 'var(--color-accent-red)';
          if (log.type === 'info') color = 'var(--color-text-dim)';

          return (
            <div key={log.id} style={{ color, wordBreak: 'break-word', lineHeight: '1.4' }}>
              <span style={{ opacity: 0.5, marginRight: '6px' }}>[{log.timestamp}]</span>
              {log.type === 'error' ? '✖ ' : log.type === 'system' ? '⚙ ' : '▶ '}
              {log.text}
            </div>
          );
        })}
        {/* Blinking CLI Cursor */}
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-accent-cyan)' }}>
          <span style={{ marginRight: '4px' }}>&gt;</span>
          <span style={{
            width: '8px',
            height: '14px',
            backgroundColor: 'var(--color-accent-cyan)',
            animation: 'pulse-cyan 1s infinite'
          }}></span>
        </div>
      </div>
    </div>
  );
};
