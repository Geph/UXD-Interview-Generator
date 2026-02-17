
import React, { useState, useRef, useEffect } from 'react';
import { StudyConfig, CoreQuestion } from '../types';
import { extractGuideFromDocument } from '../services/gemini';
import { databaseService } from '../services/database';

interface SetupFormProps {
  onStart: (config: StudyConfig) => void;
}

type InputMethod = 'manual' | 'paste' | 'gdoc' | 'pdf' | null;

export const SetupForm: React.FC<SetupFormProps> = ({ onStart }) => {
  const [studyName, setStudyName] = useState('');
  const [researchGoal, setResearchGoal] = useState('');
  const [method, setMethod] = useState<InputMethod>(null);
  const [parsedQuestions, setParsedQuestions] = useState<CoreQuestion[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<{ status: string; message: string }>({ status: 'checking', message: 'Connecting...' });
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  // Safe check for process.env.API_KEY
  const hasApiKey = typeof process !== 'undefined' && !!process.env?.API_KEY;

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));

  useEffect(() => {
    const checkSystems = async () => {
      addLog("Initializing systems...");
      const health = await databaseService.checkConnection();
      setDbStatus(health);
      addLog(`Database Check: ${health.status.toUpperCase()} - ${health.message}`);
      
      if (!hasApiKey) {
        addLog("CRITICAL: Gemini API Key missing or not baked into build.");
      } else {
        addLog("Gemini API Key detected.");
      }
    };
    checkSystems();
  }, [hasApiKey]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    addLog(`Reading PDF: ${file.name}`);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const extracted = await extractGuideFromDocument({
          mimeType: file.type,
          data: base64
        }, false);
        setParsedQuestions(prev => [...prev, ...extracted]);
        addLog(`Extracted ${extracted.length} questions from PDF.`);
      } catch (err) {
        addLog(`PDF Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualAdd = () => {
    const newQ: CoreQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      predefinedProbes: []
    };
    setParsedQuestions([...parsedQuestions, newQ]);
  };

  const updateQuestionText = (id: string, text: string) => {
    setParsedQuestions(prev => prev.map(q => q.id === id ? { ...q, text } : q));
  };

  const removeQuestion = (id: string) => {
    setParsedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const parsePaste = async () => {
    if (!editorRef.current) return;
    setIsExtracting(true);
    const text = editorRef.current.innerText;
    addLog("Parsing pasted text structure...");
    try {
      const extracted = await extractGuideFromDocument(text, true);
      setParsedQuestions(prev => [...prev, ...extracted]);
      addLog(`Synthesized ${extracted.length} questions.`);
      if (editorRef.current) editorRef.current.innerText = '';
      setMethod(null);
    } catch (err) {
      addLog(`AI Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDragStart = (idx: number) => setDraggedIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === idx) return;
    const items = [...parsedQuestions];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(idx, 0, draggedItem);
    setParsedQuestions(items);
    setDraggedIndex(idx);
  };

  const isFormValid = studyName.trim() !== '' && 
                      researchGoal.trim() !== '' && 
                      parsedQuestions.length > 0 &&
                      parsedQuestions.every(q => q.text.trim() !== '') &&
                      hasApiKey;

  const handleLaunch = () => {
    if (!isFormValid) return;
    addLog("Launching session...");
    onStart({ studyName, researchGoal, coreQuestions: parsedQuestions });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* SYSTEM HEALTH TOP BAR */}
      <div className="flex flex-wrap gap-4 items-center justify-center">
         <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm ${hasApiKey ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`}></div>
            GEMINI ENGINE: {hasApiKey ? 'READY' : 'OFFLINE'}
         </div>
         <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm ${dbStatus.status === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dbStatus.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
            DATABASE BRIDGE: {dbStatus.status.toUpperCase()}
         </div>
         <button onClick={() => setShowLogs(!showLogs)} className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            {showLogs ? 'Hide Logs' : 'View System Logs'}
         </button>
      </div>

      {showLogs && (
        <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] text-emerald-400 space-y-1 shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200">
          <p className="text-slate-500 mb-2">// System Initialization Verbose Output</p>
          {logs.map((log, i) => <p key={i}>{log}</p>)}
        </div>
      )}

      {/* CORE INFO */}
      <section className="space-y-10">
        <div className="text-center space-y-4">
          <h2 className="serif text-5xl font-bold text-slate-900">Study Parameters</h2>
          <p className="text-slate-400 font-medium tracking-wide">Establish the foundation for your qualitative session.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Study Name</label>
            <input 
              type="text" 
              placeholder="e.g. Mobile Banking UX V2" 
              className="w-full px-8 py-6 bg-white border-2 border-slate-100 rounded-3xl text-xl font-light focus:border-indigo-500 outline-none transition-all shadow-sm"
              value={studyName}
              onChange={e => setStudyName(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Research Goal</label>
            <input 
              type="text" 
              placeholder="e.g. Understand friction in onboarding" 
              className="w-full px-8 py-6 bg-white border-2 border-slate-100 rounded-3xl text-xl font-light focus:border-indigo-500 outline-none transition-all shadow-sm"
              value={researchGoal}
              onChange={e => setResearchGoal(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* QUESTION BUILDER */}
      <section className="space-y-10">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-2">
            <h2 className="serif text-4xl font-bold text-slate-900">Interview Guide</h2>
            <p className="text-slate-400 font-medium tracking-wide">Core questions to be addressed during the session.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setMethod('paste')}
              className="px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
              Paste Guide
            </button>
            <button 
              onClick={handleManualAdd}
              className="px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Question
            </button>
          </div>
        </div>

        {method === 'paste' && (
          <div className="bg-slate-900 rounded-[2rem] p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <h3 className="text-white serif text-2xl font-semibold">Smart Synthesis</h3>
              <button onClick={() => setMethod(null)} className="text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div 
              ref={editorRef}
              contentEditable
              className="w-full min-h-[200px] bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-slate-300 outline-none focus:border-indigo-500 transition-all font-light text-lg"
              placeholder="Paste your rough notes or full guide here..."
            ></div>
            <button 
              onClick={parsePaste}
              disabled={isExtracting}
              className="w-full py-5 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing Structure...
                </>
              ) : (
                'Extract Core Questions'
              )}
            </button>
          </div>
        )}

        <div className="space-y-4">
          {parsedQuestions.map((q, idx) => (
            <div 
              key={q.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              className={`group flex gap-6 items-start bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-100 transition-all shadow-sm ${draggedIndex === idx ? 'opacity-50 scale-95 border-dashed border-indigo-400' : ''}`}
            >
              <div className="mt-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 block">Question {idx + 1}</span>
                <input 
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestionText(q.id, e.target.value)}
                  className="w-full bg-transparent text-2xl font-light text-slate-900 border-none outline-none placeholder:text-slate-200"
                  placeholder="What is the first thing you want to ask?"
                />
              </div>
              <button 
                onClick={() => removeQuestion(q.id)}
                className="mt-2 text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          ))}

          {parsedQuestions.length === 0 && !method && (
            <div className="py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <p className="font-semibold text-lg">No questions added yet</p>
              <div className="flex gap-4">
                 <button onClick={handleManualAdd} className="text-indigo-600 font-bold hover:underline">Manual Add</button>
                 <span className="text-slate-300">or</span>
                 <button onClick={() => setMethod('paste')} className="text-indigo-600 font-bold hover:underline">Paste Guide</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* LAUNCH CTA */}
      <section className="pt-10 flex flex-col items-center gap-6">
        <button 
          onClick={handleLaunch}
          disabled={!isFormValid}
          className={`group relative px-16 py-8 rounded-[2.5rem] text-2xl font-black uppercase tracking-[0.2em] transition-all overflow-hidden ${isFormValid ? 'bg-slate-900 text-white shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98]' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity`}></div>
          <span className="relative z-10 flex items-center gap-4">
            Begin Interview Session
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </span>
        </button>
        {!hasApiKey && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Critical: Build system did not detect Gemini API Key</p>}
        {isFormValid && <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
          Validated & Ready for Deployment
        </p>}
      </section>
    </div>
  );
};
