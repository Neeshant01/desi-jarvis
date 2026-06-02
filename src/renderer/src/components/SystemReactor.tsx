import React from 'react';
import { useJarvisStore } from '../store/useStore';

interface SystemReactorProps {
  style?: React.CSSProperties;
}

export const SystemReactor: React.FC<SystemReactorProps> = ({ style }) => {
  const { cpu, ram, gpu, network } = useJarvisStore((state: any) => state.metrics);
  const status = useJarvisStore((state: any) => state.status);

  // SVG parameters
  const size = 180;
  const center = size / 2;
  
  // Radius values for concentric rings
  const rNetwork = 76;
  const rGpu = 62;
  const rRam = 48;
  const rCpu = 34;

  const getStrokeDash = (radius: number, percentage: number) => {
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return {
      strokeDasharray: `${circumference}`,
      strokeDashoffset: `${strokeDashoffset}`
    };
  };

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '420px',
        height: '240px',
        zIndex: 10,
        padding: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transform: 'perspective(1000px) rotateY(-10deg) rotateX(5deg)',
        borderRight: '3px solid var(--color-accent-cyan)',
        boxShadow: 'var(--shadow-neon-cyan)',
        ...style
      }}
    >
      {/* SVG Arc Reactor */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Filters for glowing neon effects */}
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Network Ring (Outermost) */}
          <circle cx={center} cy={center} r={rNetwork} fill="none" stroke="rgba(255, 170, 0, 0.05)" strokeWidth="6" />
          <circle 
            cx={center} cy={center} r={rNetwork} fill="none" 
            stroke="var(--color-accent-amber)" strokeWidth="6" 
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            {...getStrokeDash(rNetwork, Math.min(100, (network / 50) * 100))}
            filter="url(#glow-amber)"
          />

          {/* GPU Ring */}
          <circle cx={center} cy={center} r={rGpu} fill="none" stroke="rgba(0, 136, 255, 0.05)" strokeWidth="6" />
          <circle 
            cx={center} cy={center} r={rGpu} fill="none" 
            stroke="var(--color-accent-blue)" strokeWidth="6" 
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            {...getStrokeDash(rGpu, gpu)}
            filter="url(#glow-cyan)"
          />

          {/* RAM Ring */}
          <circle cx={center} cy={center} r={rRam} fill="none" stroke="rgba(0, 255, 65, 0.05)" strokeWidth="6" />
          <circle 
            cx={center} cy={center} r={rRam} fill="none" 
            stroke="var(--color-accent-green)" strokeWidth="6" 
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            {...getStrokeDash(rRam, ram)}
            filter="url(#glow-green)"
          />

          {/* CPU Ring (Innermost) */}
          <circle cx={center} cy={center} r={rCpu} fill="none" stroke="rgba(255, 51, 51, 0.05)" strokeWidth="6" />
          <circle 
            cx={center} cy={center} r={rCpu} fill="none" 
            stroke="var(--color-accent-red)" strokeWidth="6" 
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            {...getStrokeDash(rCpu, cpu)}
            filter="url(#glow-red)"
          />
        </svg>

        {/* Center pulsing core status dot */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div className={`pulsing-dot ${status !== 'connected' ? 'red' : 'green'}`} style={{ width: '16px', height: '16px' }} />
        </div>
      </div>

      {/* Metrics Data Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'monospace' }}>
        <div style={{ borderBottom: '1px solid rgba(0, 255, 255, 0.15)', paddingBottom: '5px', color: 'var(--color-accent-cyan)', fontWeight: 'bold' }}>
          SYSTEM DIAGNOSTICS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-accent-red)' }}>⚡ CPU LOAD</span>
            <span>{cpu}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-accent-green)' }}>💾 RAM USAGE</span>
            <span>{ram}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-accent-blue)' }}>⚙️ GPU SPEED</span>
            <span>{gpu}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-accent-amber)' }}>📡 NETWORK</span>
            <span>{network} MB/s</span>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-dim)', textAlign: 'right', marginTop: 'auto' }}>
          CORE STATUS: {status === 'connected' ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>
    </div>
  );
};
