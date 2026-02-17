
import React, { useState, useRef, useEffect } from 'react';
import { StudyConfig, CoreQuestion } from '../types';
import { extractGuideFromDocument } from '../services/gemini';
import { databaseService } from '../services/database';

interface SetupFormProps {
  onStart: (config: StudyConfig) => void;
  showLogs: boolean;
  onSystemStatusChange: (ready: boolean) => void;
}

type InputMethod = 'manual' | 'paste' | 'pdf' | null;

export const SetupForm: React.FC<SetupFormProps> = ({ onStart, showLogs, onSystemStatusChange }) => {
  const [studyName, setStudyName] = useState('');
  const [researchGoal, setResearchGoal] = useState('');
  const [method, setMethod] = useState<InputMethod>(null);
  const [parsedQuestions, setParsedQuestions] = useState<CoreQuestion[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [logs, setLogs] = useState<string[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const apiKey = process.env.API_KEY;
  const hasApiKey = !!apiKey && apiKey !== 'undefined' && apiKey !== '';

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));

  useEffect(() => {
    const checkSystems = async () => {
      addLog("Initializing systems...");
      const health = await databaseService.checkConnection();
      setDbStatus(health.status === 'connected' ? 'connected' : 'error');
      addLog(`Database Check: ${health.status.toUpperCase()}`);
      
      if (!hasApiKey) {
        addLog("CRITICAL: Gemini API Key missing from build.");
      } else {
        addLog("Gemini API Key detected.");
      }

      onSystemStatusChange(hasApiKey && health.status === 'connected');
    };
    checkSystems();
  }, [hasApiKey, onSystemStatusChange]);

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
    addLog("Parsing guide structure & nesting...");
    try {
      const extracted = await extractGuideFromDocument(text, true);
      setParsedQuestions(prev => [...prev, ...extracted]);
      addLog(`Synthesized ${extracted.length} core blocks with probes.`);
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
      
      {showLogs && (
        <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] text-emerald-400 space-y-1 shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200">
          <p className="text-slate-500 mb-2">// System Diagnostics</p>
          {logs.map((log, i) => <p key={i}>{log}</p>)}
        </div>
      )}

      {/* CORE INFO */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="serif text-5xl font-bold text-slate-900">Study Parameters</h2>
          <p className="text-slate-400 font-medium tracking-wide">Establish the foundation for your qualitative research.</p>
        </div>

        <div className="space-y-10">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Study Name</label>
            <input 
              type="text" 
              placeholder="e.g. Mobile App Usability Research" 
              className="w-full px-8 py-6 bg-white border-2 border-slate-100 rounded-3xl text-2xl font-light focus:border-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-200"
              value={studyName}
              onChange={e => setStudyName(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Research Goal & Context</label>
            <textarea 
              placeholder="Describe the primary objectives of this study. What are you trying to learn from the respondent? This helps the AI generate more relevant follow-up probes." 
              className="w-full px-8 py-6 bg-white border-2 border-slate-100 rounded-[2rem] text-xl font-light focus:border-indigo-500 outline-none transition-all shadow-sm min-h-[160px] resize-none leading-relaxed placeholder:text-slate-200"
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
            <p className="text-slate-400 font-medium tracking-wide">Add core questions or paste your structured guide.</p>
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
          <div className="bg-slate-900 rounded-[2rem] p-10 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl ring-1 ring-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white serif text-2xl font-semibold">Guide Synthesis</h3>
                <p className="text-slate-500 text-sm mt-1">Indentation will be interpreted as probes for the preceding question.</p>
              </div>
              <button onClick={() => setMethod(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div 
              ref={editorRef}
              contentEditable
              style={{ whiteSpace: 'pre-wrap' }}
              className="w-full min-h-[300px] bg-slate-800/80 border border-slate-700 rounded-2xl p-8 text-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-base leading-relaxed overflow-y-auto"
              placeholder="Paste guide here (e.g.)&#10;1. How do you feel?&#10;   - Tell me more about that&#10;   - Why specifically that feeling?"
            ></div>
            
            <button 
              onClick={parsePaste}
              disabled={isExtracting}
              className="w-full py-6 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
            >
              {isExtracting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Synthesizing Structure...
                </>
              ) : 'Analyze and Extract Questions'}
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
              className={`group flex gap-6 items-start bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-100 transition-all shadow-sm ${draggedIndex === idx ? 'opacity-50 grayscale scale-[0.98]' : ''}`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Question {idx + 1}</span>
                   {q.predefinedProbes.length > 0 && (
                     <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                       {q.predefinedProbes.length} NESTED PROBES
                     </span>
                   )}
                </div>
                <input 
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestionText(q.id, e.target.value)}
                  className="w-full bg-transparent text-2xl font-light text-slate-900 border-none outline-none placeholder:text-slate-200"
                  placeholder="Enter core question..."
                />
              </div>
              <button 
                onClick={() => removeQuestion(q.id)} 
                className="mt-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
          className={`px-16 py-8 rounded-[2.5rem] text-2xl font-black uppercase tracking-[0.2em] transition-all ${isFormValid ? 'bg-slate-900 text-white shadow-2xl shadow-indigo-200/50 hover:scale-[1.02] active:scale-[0.98]' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
        >
          Begin Interview Session
        </button>
        {!hasApiKey && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Critical: Missing API Key in build environment</p>}
      </section>
    </div>
  );
};
