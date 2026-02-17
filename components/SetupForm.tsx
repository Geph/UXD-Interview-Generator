
import React, { useState, useRef, useEffect } from 'react';
import { StudyConfig, CoreQuestion } from '../types';
import { extractGuideFromDocument } from '../services/gemini';
import { databaseService, DB_CONFIG } from '../services/database';

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

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));

  useEffect(() => {
    const checkSystems = async () => {
      addLog("Initializing systems...");
      const health = await databaseService.checkConnection();
      setDbStatus(health);
      addLog(`Database Check: ${health.status.toUpperCase()} - ${health.message}`);
      
      if (!process.env.API_KEY) {
        addLog("CRITICAL: Gemini API Key missing from environment.");
      } else {
        addLog("Gemini API Key detected.");
      }
    };
    checkSystems();
  }, []);

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

  const parsePaste = async () => {
    if (!editorRef.current) return;
    setIsExtracting(true);
    const text = editorRef.current.innerText;
    addLog("Parsing pasted text structure...");
    try {
      const extracted = await extractGuideFromDocument(text, true);
      setParsedQuestions(prev => [...prev, ...extracted]);
      addLog(`Synthesized ${extracted.length} questions.`);
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
                      parsedQuestions.every(q => q.text.trim() !== '');

  const handleLaunch = () => {
    if (!isFormValid) return;
    addLog("Launching session...");
    onStart({ studyName, researchGoal, coreQuestions: parsedQuestions });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* SYSTEM HEALTH TOP BAR */}
      <div className="flex flex-wrap gap-4 items-center justify-center">
         <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm ${process.env.API_KEY ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${process.env.API_KEY ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`}></div>
            GEMINI ENGINE: {process.env.API_KEY ? 'READY' : 'OFFLINE'}
         </div>
         <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm ${dbStatus.status === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : dbStatus.status === 'mock' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dbStatus.status === 'connected' ? 'bg-emerald-500' : dbStatus.status === 'mock' ? 'bg-indigo-500' : 'bg-amber-500 animate-pulse'}`}></div>
            MYSQL BRIDGE: {dbStatus.status.toUpperCase()}
         </div>
      </div>

      {/* SECTION 1: IDENTITY */}
      <section className="space-y-10">
        <div className="text-center">
          <h2 className="serif text-7xl font-semibold text-slate-900 mb-6 tracking-tight">Interview Identity</h2>
          <p className="text-slate-500 text-xl font-light max-w-2xl mx-auto">First, give your study a name and define the core objective the AI should focus on during the conversation.</p>
        </div>
        
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-indigo-100/20 space-y-12">
          <div className="group">
            <label className="block text-[10px] font-bold text-slate-300 group-focus-within:text-indigo-500 uppercase tracking-[0.3em] mb-4 transition-colors">Study Title</label>
            <input 
              type="text" 
              placeholder="e.g. Remote Collaboration Discovery"
              className="w-full text-4xl font-medium px-0 py-3 border-b-2 border-slate-50 focus:border-indigo-500 transition-all outline-none bg-transparent placeholder:text-slate-100"
              value={studyName}
              onChange={e => setStudyName(e.target.value)}
            />
          </div>
          <div className="group">
            <label className="block text-[10px] font-bold text-slate-300 group-focus-within:text-indigo-500 uppercase tracking-[0.3em] mb-4 transition-colors">Research Purpose</label>
            <textarea 
              placeholder="What specifically are you trying to learn? The AI will use this to generate smart follow-ups."
              className="w-full text-xl px-0 py-3 border-b-2 border-slate-50 focus:border-indigo-500 transition-all outline-none bg-transparent placeholder:text-slate-100 min-h-[120px] resize-none leading-relaxed"
              value={researchGoal}
              onChange={e => setResearchGoal(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: CONTENT SOURCE */}
      <section className="space-y-10">
        <div className="text-center">
          <h3 className="serif text-5xl font-semibold text-slate-800 mb-4">Interview Guide</h3>
          <p className="text-slate-400 text-lg">Choose your preferred way to input your questions and probes.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'manual', label: 'Draft Manually', icon: 'M', desc: 'Step-by-step entry' },
            { id: 'paste', label: 'Paste Guide', icon: 'P', desc: 'From Word / GDoc' },
            { id: 'gdoc', label: 'Google Doc', icon: 'G', desc: 'Public Doc link' },
            { id: 'pdf', label: 'PDF Upload', icon: 'F', desc: 'Analyze PDF guide' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id as InputMethod)}
              className={`p-8 rounded-[2.5rem] border-2 text-left transition-all group ${method === m.id ? 'border-indigo-500 bg-indigo-50/50 shadow-xl' : 'border-slate-50 bg-white hover:border-slate-200 shadow-sm'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl mb-6 transition-all ${method === m.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100'}`}>
                {m.icon}
              </div>
              <div className="font-bold text-slate-800 text-sm mb-2 uppercase tracking-wide">{m.label}</div>
              <div className="text-xs text-slate-400 leading-relaxed font-medium">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Dynamic Input Panel */}
        <div className="min-h-[200px] bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-2xl shadow-indigo-100/10">
          {method === 'manual' && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
              {parsedQuestions.map((q, i) => (
                <div key={q.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300 shrink-0">{i+1}</div>
                  <input 
                    value={q.text}
                    onChange={e => updateQuestionText(q.id, e.target.value)}
                    placeholder={`Type question ${i+1}...`}
                    className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-50 outline-none focus:border-indigo-300 focus:bg-white transition-all font-medium text-lg"
                  />
                </div>
              ))}
              <button onClick={handleManualAdd} className="w-full p-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 font-bold hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Add Core Question</span>
              </button>
            </div>
          )}

          {method === 'paste' && (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
              <div 
                ref={editorRef}
                contentEditable 
                className="w-full min-h-[350px] p-10 outline-none text-slate-700 text-2xl leading-relaxed whitespace-pre-wrap font-light border-2 border-slate-50 rounded-[2rem] bg-slate-50/30 focus:bg-white focus:border-indigo-100 transition-all"
                placeholder="Paste your bulleted guide here. Gemini will identify core questions and sub-probes."
              />
              <button 
                onClick={parsePaste}
                disabled={isExtracting}
                className="w-full py-6 bg-slate-900 text-white font-bold text-lg rounded-[2rem] shadow-2xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isExtracting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Extracting Structure...</span>
                  </>
                ) : 'Extract Questions with Gemini'}
              </button>
            </div>
          )}

          {method === 'gdoc' && (
            <div className="flex flex-col items-center justify-center gap-6 py-12 animate-in slide-in-from-top-4 duration-500">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              </div>
              <div className="w-full max-w-xl flex gap-3">
                <input 
                  type="text" 
                  placeholder="https://docs.google.com/document/d/..."
                  className="flex-1 p-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-indigo-300 transition-all font-medium"
                />
                <button onClick={() => addLog('GDoc import simulated.')} className="px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all">Import</button>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Requires public sharing permissions</p>
            </div>
          )}

          {method === 'pdf' && (
            <div className="flex flex-col items-center justify-center gap-8 py-16 animate-in slide-in-from-top-4 duration-500">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-2 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="12" y2="18"/><line x1="12" y1="18" x2="15" y2="15"/><line x1="12" y1="12" x2="12" y2="18"/></svg>
              </div>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileUpload} 
                className="hidden" 
                id="pdf-upload"
              />
              <div className="text-center space-y-2">
                <label htmlFor="pdf-upload" className="px-12 py-6 bg-slate-900 text-white font-bold text-xl rounded-[2rem] cursor-pointer hover:bg-black transition-all shadow-2xl block">
                  {isExtracting ? 'Gemini is Analyzing...' : 'Upload PDF Research Guide'}
                </label>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Max 20MB • Fast Extraction</p>
              </div>
            </div>
          )}

          {!method && (
            <div className="flex flex-col items-center justify-center h-full text-slate-200 italic py-20">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-20"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
               <span className="text-lg">Select an input method above to populate your guide.</span>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: REVIEW & REORDER */}
      {parsedQuestions.length > 0 && (
        <section className="space-y-10 animate-in fade-in duration-1000">
          <div className="text-center">
            <h3 className="serif text-5xl font-semibold text-slate-800 mb-4">Review & Refine</h3>
            <p className="text-slate-400 text-lg">Verify the final sequence. Drag items to reorder the interview flow.</p>
          </div>

          <div className="space-y-4">
            {parsedQuestions.map((q, idx) => (
              <div 
                key={q.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                className={`bg-white p-8 rounded-[2rem] border transition-all flex items-start gap-6 cursor-grab active:cursor-grabbing group hover:shadow-xl hover:scale-[1.01] ${draggedIndex === idx ? 'opacity-30 border-indigo-500' : 'border-slate-50 shadow-sm hover:border-indigo-100'}`}
              >
                <div className="mt-1 text-slate-200 group-hover:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-slate-800 text-xl leading-relaxed mb-4">{q.text || <span className="text-slate-200 italic font-normal">Untitled Question</span>}</h5>
                  {q.predefinedProbes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {q.predefinedProbes.map((p, pi) => (
                        <span key={pi} className="text-[10px] bg-indigo-50 text-indigo-500 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-indigo-100/50">Probe: {p}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setParsedQuestions(prev => prev.filter(item => item.id !== q.id))}
                  className="text-slate-200 hover:text-red-500 transition-colors p-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LAUNCH BUTTON */}
      <div className="pt-16 border-t border-slate-100">
        <button 
          onClick={handleLaunch}
          disabled={!isFormValid}
          className={`w-full py-10 rounded-[3rem] font-black text-3xl transition-all shadow-2xl ${isFormValid ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:-translate-y-2' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}`}
        >
          {isFormValid ? 'Launch Live Research Session' : 'Setup Required to Launch'}
        </button>
        
        {/* DEBUG LOG TOGGLE */}
        <div className="mt-8">
            <button 
                onClick={() => setShowLogs(!showLogs)}
                className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-500 transition-colors block mx-auto"
            >
                {showLogs ? 'Hide System Logs' : 'View System Logs'}
            </button>
            {showLogs && (
                <div className="mt-4 p-6 bg-slate-900 rounded-3xl font-mono text-[10px] text-emerald-400 space-y-1 shadow-2xl">
                    {logs.map((log, i) => <div key={i} className="opacity-80">{log}</div>)}
                    {logs.length === 0 && <div className="italic opacity-40">No activity yet...</div>}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
