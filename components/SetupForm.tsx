
import React, { useState, useRef, useEffect } from 'react';
import { StudyConfig, CoreQuestion } from '../types';
import { extractGuideFromDocument } from '../services/gemini';
import { databaseService } from '../services/database';

interface SetupFormProps {
  onStart: (config: StudyConfig) => void;
}

type InputMethod = 'manual' | 'paste' | 'pdf' | null;

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

  // Check process.env.API_KEY provided by the bundler (Vite)
  const apiKey = process.env.API_KEY;
  const hasApiKey = !!apiKey && apiKey !== 'undefined' && apiKey !== '';

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));

  useEffect(() => {
    const checkSystems = async () => {
      addLog("Initializing systems...");
      const health = await databaseService.checkConnection();
      setDbStatus(health);
      addLog(`Database Check: ${health.status.toUpperCase()}`);
      
      if (!hasApiKey) {
        addLog("CRITICAL: Gemini API Key missing from process.env.API_KEY. Ensure you set it before build.");
      } else {
        addLog("Gemini API Key detected.");
      }
    };
    checkSystems();
  }, [hasApiKey]);

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
    addLog("Parsing guide structure...");
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
          <p className="text-slate-500 mb-2">// System Initialization Verbose</p>
          {logs.map((log, i) => <p key={i}>{log}</p>)}
        </div>
      )}

      {/* CORE INFO */}
      <section className="space-y-10">
        <div className="text-center space-y-4">
          <h2 className="serif text-5xl font-bold text-slate-900">Study Parameters</h2>
          <p className="text-slate-400 font-medium tracking-wide">Establish the foundation for your research.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Study Name</label>
            <input 
              type="text" 
              placeholder="e.g. Mobile App Usability" 
              className="w-full px-8 py-6 bg-white border-2 border-slate-100 rounded-3xl text-xl font-light focus:border-indigo-500 outline-none transition-all shadow-sm"
              value={studyName}
              onChange={e => setStudyName(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Research Goal</label>
            <input 
              type="text" 
              placeholder="e.g. Test checkout flow friction" 
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
            <p className="text-slate-400 font-medium tracking-wide">Add your core questions below.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setMethod('paste')}
              className="px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              Paste Guide
            </button>
            <button 
              onClick={handleManualAdd}
              className="px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              Add Question
            </button>
          </div>
        </div>

        {method === 'paste' && (
          <div className="bg-slate-900 rounded-[2rem] p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <div 
              ref={editorRef}
              contentEditable
              className="w-full min-h-[200px] bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-slate-300 outline-none focus:border-indigo-500 transition-all font-light text-lg"
              placeholder="Paste your rough guide here..."
            ></div>
            <button 
              onClick={parsePaste}
              disabled={isExtracting}
              className="w-full py-5 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-400 transition-all disabled:opacity-50"
            >
              {isExtracting ? 'Extracting...' : 'Extract Core Questions'}
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
              className={`group flex gap-6 items-start bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-100 transition-all shadow-sm ${draggedIndex === idx ? 'opacity-50' : ''}`}
            >
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 block">Question {idx + 1}</span>
                <input 
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestionText(q.id, e.target.value)}
                  className="w-full bg-transparent text-2xl font-light text-slate-900 border-none outline-none"
                  placeholder="Enter question text..."
                />
              </div>
              <button onClick={() => removeQuestion(q.id)} className="text-slate-200 hover:text-red-400 transition-all">
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* LAUNCH CTA */}
      <section className="pt-10 flex flex-col items-center gap-6">
        <button 
          onClick={() => onStart({ studyName, researchGoal, coreQuestions: parsedQuestions })}
          disabled={!isFormValid}
          className={`px-16 py-8 rounded-[2.5rem] text-2xl font-black uppercase tracking-[0.2em] transition-all ${isFormValid ? 'bg-slate-900 text-white shadow-2xl hover:scale-[1.02]' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
        >
          Begin Interview Session
        </button>
        {!hasApiKey && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Critical: Missing API Key in build environment</p>}
      </section>
    </div>
  );
};
