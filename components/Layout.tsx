
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="w-full border-b border-slate-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">I</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">InsightPro</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1">Research Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Engine Active</span>
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
