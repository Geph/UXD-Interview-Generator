
import React, { useState, useRef } from 'react';
import { StudyConfig, CoreQuestion } from '../types';
import { extractGuideFromDocument } from '../services/gemini';

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
  
  const editorRef = useRef<HTMLDivElement>(null);

  // --- Actions ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const extracted = await extractGuideFromDocument({
        mimeType: file.type,
        data: base64
      }, false);
      setParsedQuestions(prev => [...prev, ...extracted]);
      setIsExtracting(false);
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
    const extracted = await extractGuideFromDocument(text, true);
    setParsedQuestions(prev => [...prev, ...extracted]);
    setIsExtracting(false);
  };

  const handleLaunch = () => {
    if (!studyName || !researchGoal || parsedQuestions.length === 0) return;
    onStart({ studyName, researchGoal, coreQuestions: parsedQuestions });
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

  // Define isFormValid to fix reference errors and ensure quality of setup
  const isFormValid = studyName.trim() !== '' && 
                      researchGoal.trim() !== '' && 
                      parsedQuestions.length > 0 &&
                      parsedQuestions.every(q => q.text.trim() !== '');

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      {/* 1. Identity & Purpose */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="serif text-6xl font-semibold text-slate-900 mb-4 tracking-tight">Interview Identity</h2>
          <p className="text-slate-500 text-xl font-light">Set the context and purpose for this research session.</p>
        </div>
        
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-4">Study Title</label>
            <input 
              type="text" 
              placeholder="e.g. Workplace Wellness Deep-Dive"
              className="w-full text-3xl font-medium px-0 py-2 border-b-2 border-slate-100 focus:border-indigo-500 transition-all outline-none bg-transparent placeholder:text-slate-100"
              value={studyName}
              onChange={e => setStudyName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-4">Research Purpose</label>
            <textarea 
              placeholder="What specific insights are you hoping to elicit from respondents?"
              className="w-full text-lg px-0 py-2 border-b-2 border-slate-100 focus:border-indigo-500 transition-all outline-none bg-transparent placeholder:text-slate-100 min-h-[100px] resize-none"
              value={researchGoal}
              onChange={e => setResearchGoal(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 2. Choose Method */}
      <section className="space-y-8">
        <div className="text-center">
          <h3 className="serif text-4xl font-semibold text-slate-800">Source Material</h3>
          <p className="text-slate-400 text-lg">How would you like to build your interview guide?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'manual', label: 'Draft Manually', icon: 'M', desc: 'Type each question one by one.' },
            { id: 'paste', label: 'Paste Guide', icon: 'P', desc: 'Copy from Word/Doc with probes.' },
            { id: 'gdoc', label: 'Google Doc', icon: 'G', desc: 'Sync directly via document link.' },
            { id: 'pdf', label: 'PDF Upload', icon: 'F', desc: 'Extract guide from a PDF file.' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id as InputMethod)}
              className={`p-6 rounded-[2rem] border-2 text-left transition-all ${method === m.id ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold mb-4 ${method === m.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {m.icon}
              </div>
              <div className="font-bold text-slate-800 text-sm mb-1">{m.label}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Dynamic Input Areas */}
        <div className="min-h-[200px] bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-8">
          {method === 'manual' && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
              {parsedQuestions.map((q, i) => (
                <input 
                  key={q.id}
                  value={q.text}
                  onChange={e => updateQuestionText(q.id, e.target.value)}
                  placeholder={`Question ${i+1}...`}
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-indigo-300 transition-all font-medium"
                />
              ))}
              <button onClick={handleManualAdd} className="w-full p-4 border-2 border-slate-100 rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-all">+ Add Question</button>
            </div>
          )}

          {method === 'paste' && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div 
                ref={editorRef}
                contentEditable 
                className="w-full min-h-[300px] p-8 outline-none text-slate-700 text-xl leading-relaxed whitespace-pre-wrap"
                placeholder="Paste your bulleted guide here..."
              />
              <button 
                onClick={parsePaste}
                disabled={isExtracting}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isExtracting ? 'Synthesizing...' : 'Process Guide'}
              </button>
            </div>
          )}

          {method === 'gdoc' && (
            <div className="flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
              <input 
                type="text" 
                placeholder="Enter Google Doc public URL..."
                className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none"
              />
              <button onClick={() => alert('For the prototype, please use the Paste or PDF method.')} className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl">Import</button>
            </div>
          )}

          {method === 'pdf' && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 animate-in slide-in-from-top-4 duration-300">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              </div>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileUpload} 
                className="hidden" 
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl cursor-pointer hover:bg-black transition-all">
                {isExtracting ? 'Analyzing PDF with Gemini...' : 'Choose PDF Guide'}
              </label>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Max size 20MB</p>
            </div>
          )}

          {!method && (
            <div className="flex items-center justify-center h-full text-slate-300 italic">Select an input method to begin building your guide...</div>
          )}
        </div>
      </section>

      {/* 3. Review & Reorder */}
      {parsedQuestions.length > 0 && (
        <section className="space-y-8 animate-in fade-in duration-500">
          <div className="text-center">
            <h3 className="serif text-4xl font-semibold text-slate-800">Review Sequence</h3>
            <p className="text-slate-400 text-lg">Verify and reorder the flow of your interview.</p>
          </div>

          <div className="space-y-3">
            {parsedQuestions.map((q, idx) => (
              <div 
                key={q.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-start gap-4 cursor-grab active:cursor-grabbing group hover:border-indigo-200 transition-all"
              >
                <div className="mt-1 text-slate-200 group-hover:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-slate-800 mb-1">{q.text || <span className="text-slate-200">Empty Question</span>}</h5>
                  {q.predefinedProbes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {q.predefinedProbes.map((p, pi) => (
                        <span key={pi} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Probe: {p}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setParsedQuestions(prev => prev.filter(item => item.id !== q.id))}
                  className="text-slate-300 hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Launch */}
      <div className="pt-12">
        <button 
          onClick={handleLaunch}
          disabled={!isFormValid}
          className={`w-full py-8 rounded-[2.5rem] font-black text-2xl transition-all shadow-2xl ${isFormValid ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:-translate-y-1' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}`}
        >
          {isFormValid ? 'Launch Live Research Session' : 'Complete Setup to Launch'}
        </button>
      </div>
    </div>
  );
};
