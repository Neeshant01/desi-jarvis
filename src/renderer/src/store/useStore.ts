import { create } from 'zustand';

export interface TerminalLog {
  id: string;
  text: string;
  type: 'info' | 'system' | 'ai' | 'error';
  timestamp: string;
}

export interface SystemMetrics {
  cpu: number;
  ram: number;
  gpu: number;
  network: number;
}

export interface BrowserState {
  status: 'stopped' | 'active' | 'paused_for_captcha';
  screenshot: string;
  url: string;
}

interface JarvisStore {
  status: 'connected' | 'reconnecting' | 'disconnected';
  metrics: SystemMetrics;
  terminalLogs: TerminalLog[];
  screenFrame: string | null;
  browserState: BrowserState;
  micVolume: number;
  lastTranscript: string;
  interimTranscript: string;
  voiceLanguage: string;
  voiceResponses: boolean;
  isProcessing: boolean;
  
  setStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void;
  updateMetrics: (metrics: Partial<SystemMetrics>) => void;
  addLog: (text: string, type?: 'info' | 'system' | 'ai' | 'error') => void;
  setScreenFrame: (frame: string | null) => void;
  setBrowserState: (state: Partial<BrowserState>) => void;
  clearLogs: () => void;
  setMicVolume: (volume: number) => void;
  setLastTranscript: (text: string) => void;
  setInterimTranscript: (text: string) => void;
  setVoiceLanguage: (lang: string) => void;
  setVoiceResponses: (enabled: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

export const useJarvisStore = create<JarvisStore>((set: any) => ({
  status: 'disconnected',
  metrics: { cpu: 0, ram: 0, gpu: 0, network: 0 },
  terminalLogs: [
    {
      id: 'init',
      text: 'J.A.R.V.I.S. Core boot initiated...',
      type: 'info',
      timestamp: new Date().toLocaleTimeString()
    }
  ],
  screenFrame: null,
  browserState: { status: 'stopped', screenshot: '', url: '' },
  micVolume: 0,
  lastTranscript: '',
  interimTranscript: '',
  voiceLanguage: 'en-US',
  voiceResponses: true,
  isProcessing: false,

  setStatus: (status: any) => set({ status }),
  
  updateMetrics: (newMetrics: any) => set((state: any) => ({
    metrics: { ...state.metrics, ...newMetrics }
  })),
  
  addLog: (text: string, type: any = 'info') => set((state: any) => {
    // Keep max 50 logs to prevent memory bloat
    const newLogs = [
      ...state.terminalLogs,
      {
        id: Math.random().toString(36).substring(7),
        text,
        type,
        timestamp: new Date().toLocaleTimeString()
      }
    ];
    if (newLogs.length > 50) {
      newLogs.shift();
    }
    return { terminalLogs: newLogs };
  }),
  
  setScreenFrame: (screenFrame: any) => set({ screenFrame }),
  
  setBrowserState: (newBrowserState: any) => set((state: any) => ({
    browserState: { ...state.browserState, ...newBrowserState }
  })),
  
  clearLogs: () => set({ terminalLogs: [] }),
  setMicVolume: (micVolume: any) => set({ micVolume }),
  setLastTranscript: (lastTranscript: any) => set({ lastTranscript }),
  setInterimTranscript: (interimTranscript: any) => set({ interimTranscript }),
  setVoiceLanguage: (voiceLanguage: any) => set({ voiceLanguage }),
  setVoiceResponses: (voiceResponses: any) => set({ voiceResponses }),
  setIsProcessing: (isProcessing: any) => set({ isProcessing })
}));
