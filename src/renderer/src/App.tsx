import React, { useState, useRef } from 'react';
import { useSocket } from './hooks/useSocket';
import { useJarvisStore } from './store/useStore';
import { CoreScene } from './components/CoreScene';
import { CoreOrb } from './components/CoreOrb';
import { HudRings } from './components/HudRings';
import { HexGrid } from './components/HexGrid';
import { ParticleField } from './components/ParticleField';
import { HoloTerminal } from './components/HoloTerminal';
import { SystemReactor } from './components/SystemReactor';
import { VoiceWave } from './components/VoiceWave';
import { HoloCli } from './components/HoloCli';
import CoreVideoAsset from './assets/core_video.mp4';

export const App: React.FC = () => {
  // Establish connection to local Python backend
  const { sendMessage, reconnect } = useSocket('ws://localhost:8000/ws');
  
  const status = useJarvisStore((state) => state.status);
  const screenFrame = useJarvisStore((state) => state.screenFrame);
  const browserState = useJarvisStore((state) => state.browserState);
  
  const [activeTab, setActiveTab] = useState<'desktop' | 'browser' | 'automation'>('desktop');
  const [appName, setAppName] = useState('');
  const [browserUrl, setBrowserUrl] = useState('https://news.ycombinator.com');
  const [browserSelector, setBrowserSelector] = useState('');
  const [browserText, setBrowserText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [date] = useState(new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const screenImgRef = useRef<HTMLImageElement>(null);

  // Live digital clock update
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Unlock Speech Synthesis on first user click or key press (autoplay bypass)
  React.useEffect(() => {
    const unlockSpeech = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          const dummy = new SpeechSynthesisUtterance('');
          window.speechSynthesis.speak(dummy);
          console.log('J.A.R.V.I.S. Speech Synthesis unlocked by user interaction.');
        } catch (e) {
          console.warn('Speech synthesis unlock failed:', e);
        }
      }
      window.removeEventListener('click', unlockSpeech);
      window.removeEventListener('keydown', unlockSpeech);
    };
    window.addEventListener('click', unlockSpeech);
    window.addEventListener('keydown', unlockSpeech);
    return () => {
      window.removeEventListener('click', unlockSpeech);
      window.removeEventListener('keydown', unlockSpeech);
    };
  }, []);

  // Listen to mouse movement for dynamic 3D tilt effects
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMouse({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle clicking on desktop screen mirror
  const handleScreenClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!screenImgRef.current) return;
    const rect = screenImgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert click coordinates to relative percentages
    const rx = clickX / rect.width;
    const ry = clickY / rect.height;

    // Send relative coordinates (backend will scale to screen size)
    const x = Math.round(rx * 1920);
    const y = Math.round(ry * 1080);
    
    sendMessage('click', { x, y, button: 'left' });
  };

  // Run desktop automation commands
  const handleLaunchApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (appName.trim()) {
      sendMessage('launch_app', { name: appName });
      setAppName('');
    }
  };

  const toggleScreenStream = () => {
    if (isStreaming) {
      sendMessage('screen_stream_stop');
      setIsStreaming(false);
    } else {
      sendMessage('screen_stream_start');
      setIsStreaming(true);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#02040a' }}>
      
      {/* 1. Holographic 3D Background Canvas */}
      <CoreScene>
        {/* CoreOrb replaced by Video Core */}
        <HudRings />
        <HexGrid />
        <ParticleField />
      </CoreScene>

      {/* Cyber Grid pattern */}
      <div className="cyber-grid" />

      {/* Cinematic overlay CRT Scanlines */}
      <div className="scanlines" />

      {/* 2. TOP FUTURISTIC HEADER BAR */}
      <div 
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '380px',
          height: '60px',
          zIndex: 10,
          padding: '0 25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transform: `perspective(1000px) rotateY(${25 + mouse.x * 10}deg) rotateX(${-5 - mouse.y * 5}deg) translateZ(${mouse.x * 20}px)`,
          transformOrigin: 'left center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 className="cyber-title" style={{ fontSize: '18px', margin: 0 }}>
            J.A.R.V.I.S.
          </h1>
          <div style={{
            height: '16px',
            width: '1px',
            backgroundColor: 'rgba(0, 255, 255, 0.3)'
          }} />
          <span style={{
            fontFamily: 'Orbitron',
            fontSize: '11px',
            color: 'var(--color-accent-blue)',
            letterSpacing: '1px'
          }}>
            MAINFRAME ONLINE
          </span>
        </div>
      </div>

      {/* Top Right Header Data */}
      <div 
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '280px',
          height: '60px',
          zIndex: 10,
          padding: '0 25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          transform: `perspective(1000px) rotateY(${-25 + mouse.x * 10}deg) rotateX(${-5 - mouse.y * 5}deg) translateZ(${-mouse.x * 20}px)`,
          transformOrigin: 'right center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontFamily: 'Orbitron', textAlign: 'right' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-accent-cyan)' }}>{time}</span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>{date}</span>
          </div>
        </div>
      </div>

      {/* AI Video Core (WhatsApp Video) */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        width: '320px',
        height: '320px',
        zIndex: 5,
        transform: `translate(-50%, -50%) perspective(1000px) rotateX(${-5 - mouse.y * 10}deg) rotateY(${mouse.x * 10}deg)`,
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(0, 255, 255, 0.4), inset 0 0 30px rgba(0, 255, 255, 0.6)',
        border: '2px solid rgba(0, 255, 255, 0.8)',
      }}>
        <video 
          src={CoreVideoAsset}
          autoPlay 
          loop 
          muted 
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            mixBlendMode: 'screen',
            opacity: 0.95
          }}
        />
      </div>

      {/* Center Voice Wave */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        zIndex: 15,
        transform: `translate(-50%, -50%) perspective(1000px) rotateX(${-5 - mouse.y * 10}deg) rotateY(${mouse.x * 10}deg)`
      }}>
        <VoiceWave sendMessage={sendMessage} />
      </div>

      {/* 3. Top-Left System Status / Bridge Connection Widget */}
      <div 
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '100px',
          left: '20px',
          width: '380px',
          padding: '12px 20px',
          zIndex: 10,
          transform: `perspective(1000px) rotateY(${25 + mouse.x * 10}deg) rotateX(${0 - mouse.y * 8}deg) translateZ(${mouse.x * 20}px)`,
          transformOrigin: 'left center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'start', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px', color: 'var(--color-accent-cyan)' }}>CORE CONNECTION STATUS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: '10px', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>{status}</span>
            <div className={`pulsing-dot ${status === 'connected' ? 'green' : status === 'reconnecting' ? 'amber' : 'red'}`} />
          </div>
        </div>
        {status !== 'connected' && (
          <button 
            onClick={reconnect}
            className="cyber-button"
            style={{ width: '100%', marginTop: '10px', padding: '6px' }}
          >
            RE-INITIATE BRIDGE
          </button>
        )}
      </div>

      {/* 4. Left Sidebar - Control Center tabs */}
      <div 
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '165px',
          left: '20px',
          width: '380px',
          height: 'calc(100vh - 430px)',
          zIndex: 10,
          padding: '20px 15px 15px 15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          transform: `perspective(1000px) rotateY(${25 + mouse.x * 10}deg) rotateX(${-mouse.y * 10}deg) translateZ(${mouse.x * 20}px)`,
          transformOrigin: 'left center'
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0, 255, 255, 0.15)', paddingBottom: '8px', gap: '5px' }}>
          <button 
            onClick={() => setActiveTab('desktop')}
            className="cyber-button"
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '9px',
              border: '1px solid ' + (activeTab === 'desktop' ? 'var(--color-accent-cyan)' : 'rgba(0, 255, 255, 0.15)'),
              background: activeTab === 'desktop' ? 'rgba(0, 255, 255, 0.1)' : 'none',
              boxShadow: activeTab === 'desktop' ? 'var(--shadow-neon-cyan)' : 'none',
              color: activeTab === 'desktop' ? '#fff' : 'var(--color-text-dim)',
            }}
          >
            MIRROR
          </button>
          <button 
            onClick={() => setActiveTab('browser')}
            className="cyber-button"
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '9px',
              border: '1px solid ' + (activeTab === 'browser' ? 'var(--color-accent-cyan)' : 'rgba(0, 255, 255, 0.15)'),
              background: activeTab === 'browser' ? 'rgba(0, 255, 255, 0.1)' : 'none',
              boxShadow: activeTab === 'browser' ? 'var(--shadow-neon-cyan)' : 'none',
              color: activeTab === 'browser' ? '#fff' : 'var(--color-text-dim)',
            }}
          >
            BROWSER
          </button>
          <button 
            onClick={() => setActiveTab('automation')}
            className="cyber-button"
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '9px',
              border: '1px solid ' + (activeTab === 'automation' ? 'var(--color-accent-cyan)' : 'rgba(0, 255, 255, 0.15)'),
              background: activeTab === 'automation' ? 'rgba(0, 255, 255, 0.1)' : 'none',
              boxShadow: activeTab === 'automation' ? 'var(--shadow-neon-cyan)' : 'none',
              color: activeTab === 'automation' ? '#fff' : 'var(--color-text-dim)',
            }}
          >
            AUTOMATION
          </button>
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* Desktop Mirror Tab */}
          {activeTab === 'desktop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
              <div style={{ display: 'flex', justifySelf: 'start', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: '10px', color: 'var(--color-text-dim)' }}>LOCAL DESKTOP MIRROR</span>
                <button
                  onClick={toggleScreenStream}
                  className="cyber-button"
                  style={{
                    padding: '4px 10px',
                    fontSize: '9px',
                    background: isStreaming ? 'rgba(0, 255, 255, 0.15)' : 'none',
                  }}
                >
                  {isStreaming ? 'STOP STREAM' : 'START STREAM'}
                </button>
              </div>
              
              <div style={{
                flex: 1,
                border: '1px solid rgba(0, 255, 255, 0.2)',
                backgroundColor: 'rgba(0, 2, 8, 0.8)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '4px',
                minHeight: '180px'
              }}>
                {isStreaming && screenFrame ? (
                  <img
                    ref={screenImgRef}
                    src={`data:image/jpeg;base64,${screenFrame}`}
                    alt="Screen Stream"
                    onClick={handleScreenClick}
                    style={{ width: '100%', height: 'auto', cursor: 'crosshair', display: 'block' }}
                  />
                ) : (
                  <div style={{ fontFamily: 'monospace', color: 'var(--color-text-dim)', fontSize: '10px', textAlign: 'center', padding: '20px' }}>
                    {isStreaming ? 'Waiting for video frame...' : 'STREAM OFFLINE. Click Start Stream.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Web Agent Tab */}
          {activeTab === 'browser' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
              
              {/* URL Address Bar */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={browserUrl}
                  onChange={(e) => setBrowserUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="cyber-input"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => sendMessage('browser_navigate', { url: browserUrl })}
                  className="cyber-button"
                  style={{ padding: '8px 16px' }}
                >
                  GO
                </button>
              </div>

              {/* Elements automation tools */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontFamily: 'Orbitron', fontSize: '9px', color: 'var(--color-text-dim)' }}>SELECTOR</label>
                  <input
                    type="text"
                    value={browserSelector}
                    onChange={(e) => setBrowserSelector(e.target.value)}
                    placeholder="button#submit"
                    className="cyber-input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontFamily: 'Orbitron', fontSize: '9px', color: 'var(--color-text-dim)' }}>TEXT INPUT</label>
                  <input
                    type="text"
                    value={browserText}
                    onChange={(e) => setBrowserText(e.target.value)}
                    placeholder="Query text"
                    className="cyber-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => sendMessage('browser_click', { selector: browserSelector })}
                  className="cyber-button"
                  style={{ flex: 1, padding: '8px' }}
                >
                  CLICK
                </button>
                <button
                  onClick={() => sendMessage('browser_type', { selector: browserSelector, text: browserText })}
                  className="cyber-button"
                  style={{ flex: 1, padding: '8px' }}
                >
                  TYPE
                </button>
              </div>

              {/* Bot verification challenge notify bar */}
              {browserState.status === 'paused_for_captcha' && (
                <div style={{
                  padding: '10px',
                  backgroundColor: 'rgba(255, 51, 51, 0.15)',
                  border: '1px solid var(--color-accent-red)',
                  color: 'var(--color-accent-red)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontFamily: 'Orbitron',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  animation: 'pulse-cyan 1.5s infinite'
                }}>
                  <span>⚠️ CAPTCHA DETECTED!</span>
                  <button
                    onClick={() => sendMessage('browser_resume')}
                    className="cyber-button"
                    style={{
                      padding: '3px 8px',
                      background: 'var(--color-accent-green)',
                      borderColor: 'var(--color-accent-green)',
                      color: '#000',
                      fontSize: '9px'
                    }}
                  >
                    RESUME
                  </button>
                </div>
              )}

              {/* Browser Preview Mirror */}
              <div style={{
                flex: 1,
                border: '1px solid rgba(0, 255, 255, 0.2)',
                backgroundColor: 'rgba(0, 2, 8, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '4px',
                minHeight: '150px'
              }}>
                {browserState.screenshot ? (
                  <img
                    src={`data:image/jpeg;base64,${browserState.screenshot}`}
                    alt="Browser Screenshot"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                ) : (
                  <div style={{ fontFamily: 'monospace', color: 'var(--color-text-dim)', fontSize: '10px' }}>
                    Browser agent stopped. Enter URL to start.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System App Launcher Automation Tab */}
          {activeTab === 'automation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <form onSubmit={handleLaunchApp} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontFamily: 'Orbitron', fontSize: '10px', color: 'var(--color-accent-cyan)' }}>Launch Binary / App</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="xterm, firefox, calc"
                    className="cyber-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    className="cyber-button"
                    style={{ padding: '8px 16px' }}
                  >
                    RUN
                  </button>
                </div>
              </form>

              <div style={{ borderTop: '1px solid rgba(0, 255, 255, 0.15)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: '10px', color: 'var(--color-text-dim)' }}>QUICK HOTKEYS</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button onClick={() => sendMessage('key', { key: 'ctrl+alt+t' })} className="cyber-button" style={{ padding: '8px', fontSize: '9px' }}>
                    Open Terminal
                  </button>
                  <button onClick={() => sendMessage('key', { key: 'super' })} className="cyber-button" style={{ padding: '8px', fontSize: '9px' }}>
                    Show Apps
                  </button>
                  <button onClick={() => sendMessage('key', { key: 'alt+Tab' })} className="cyber-button" style={{ padding: '8px', fontSize: '9px' }}>
                    Switch Windows
                  </button>
                  <button onClick={() => sendMessage('list_windows')} className="cyber-button" style={{ padding: '8px', fontSize: '9px' }}>
                    List Windows
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 5. Bottom Left Diagnostics Terminal */}
      <HoloTerminal 
        style={{
          transform: `perspective(1000px) rotateY(${25 + mouse.x * 10}deg) rotateX(${5 - mouse.y * 8}deg) translateZ(${mouse.x * 20}px)`,
          transformOrigin: 'left bottom'
        }}
      />

      {/* 6. Command CLI Bar */}
      <HoloCli 
        sendMessage={sendMessage} 
        style={{
          transform: `perspective(1000px) rotateX(${15 - mouse.y * 10}deg) rotateY(${mouse.x * 10}deg)`
        }}
      />

      {/* 7. Bottom Right Arc Reactor Monitor */}
      <SystemReactor 
        style={{
          transform: `perspective(1000px) rotateY(${-25 + mouse.x * 10}deg) rotateX(${5 - mouse.y * 8}deg) translateZ(${-mouse.x * 20}px)`,
          transformOrigin: 'right bottom'
        }}
      />

    </div>
  );
};
