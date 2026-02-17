import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onToggleLogs?: () => void;
  systemReady?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, onToggleLogs, systemReady }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="w-full border-b border-slate-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">R</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Robot Interviewer</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1">UXD Research Tool</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleLogs}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all hover:bg-slate-50 ${systemReady ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}
            >
              <div className={`h-2 w-2 rounded-full ${systemReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`}></div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">View System Logs</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 flex flex-col">
        {children}
      </main>
      <footer className="py-12 text-center">
        <div className="h-px w-20 bg-slate-200 mx-auto mb-8"></div>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">
          End-to-End Encrypted Qualitative Synthesis • Gemini 3.0
        </p>
      </footer>
    </div>
  );
};