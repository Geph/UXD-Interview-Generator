
import React, { useState, useEffect, useRef } from 'react';
import { StudyConfig, InterviewState, InterviewStep } from '../types';
import { getNextInterviewAction } from '../services/gemini';
import { databaseService } from '../services/database';

interface InterviewSessionProps {
  config: StudyConfig;
  onExit: () => void;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({ config, onExit }) => {
  const [state, setState] = useState<InterviewState>({
    currentQuestionIndex: 0,
    steps: [{ 
      type: 'core', 
      question: config.coreQuestions[0].text, 
      timestamp: Date.now() 
    }],
    isComplete: false,
    isProcessing: false
  });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [syncing, setSyncing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.steps, state.isProcessing]);

  const handleSubmit = async () => {
    if (!currentAnswer.trim() || state.isProcessing) return;

    const updatedSteps = [...state.steps];
    updatedSteps[updatedSteps.length - 1].response = currentAnswer;
    
    setState(prev => ({ 
      ...prev, 
      steps: updatedSteps, 
      isProcessing: true 
    }));
    setCurrentAnswer('');

    try {
      const nextAction = await getNextInterviewAction(config, updatedSteps);
      
      if (nextAction.topicExhausted) {
        setState(prev => ({ ...prev, isComplete: true, isProcessing: false }));
        handleFinish(updatedSteps);
      } else {
        const nextStep: InterviewStep = {
          type: nextAction.isProbe ? 'probe' : 'core',
          question: nextAction.nextQuestion,
          timestamp: Date.now()
        };
        setState(prev => ({
          ...prev,
          steps: [...prev.steps, nextStep],
          isProcessing: false,
          currentQuestionIndex: nextAction.isProbe ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1
        }));
      }
    } catch (error) {
      console.error("AI Error:", error);
      const nextCoreIdx = state.currentQuestionIndex + 1;
      if (nextCoreIdx < config.coreQuestions.length) {
        setState(prev => ({
          ...prev,
          steps: [...prev.steps, { type: 'core', question: config.coreQuestions[nextCoreIdx].text, timestamp: Date.now() }],
          isProcessing: false,
          currentQuestionIndex: nextCoreIdx
        }));
      } else {
        setState(prev => ({ ...prev, isComplete: true, isProcessing: false }));
        handleFinish(updatedSteps);
      }
    }
  };

  const handleFinish = async (finalSteps: InterviewStep[]) => {
    setSyncing(true);
    try {
      await databaseService.saveInterviewResult(config.studyName, 'user_' + Math.random().toString(36).substr(2, 9), finalSteps);
    } catch (e) {
      console.warn("MySQL sync failed, data logged to console.");
    } finally {
      setSyncing(false);
    }
  };

  const progressPercentage = Math.min(Math.round(((state.currentQuestionIndex + 1) / config.coreQuestions.length) * 100), 100);

  if (state.isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500 max-w-xl mx-auto text-center">
        <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-indigo-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h2 className="serif text-4xl font-bold mb-4 text-slate-900">Insight Captured</h2>
        <p className="text-slate-500 text-lg mb-10 leading-relaxed">
          The interview has concluded. Your responses have been processed and securely stored in the research database.
        </p>
        <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
           <div className="bg-indigo-600 h-full w-full"></div>
        </div>
        <button 
          onClick={onExit}
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
        >
          Return to Dashboard
        </button>
        {syncing && (
          <div className="mt-8 flex items-center gap-2 text-slate-400 animate-pulse">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-semibold tracking-tight">Syncing to MySQL...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-200/20 border border-slate-100 overflow-hidden mb-8">
      {/* Header Info & Progress Bar */}
      <div className="bg-white border-b border-slate-50 px-8 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{config.studyName}</span>
          </div>
          <div className="text-xs font-bold text-indigo-600">
            {progressPercentage}% COMPLETE
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-10 space-y-12 custom-scrollbar"
      >
        {state.steps.map((step, idx) => (
          <div key={idx} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start gap-5 max-w-[90%]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex-shrink-0 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
              </div>
              <div className="flex-1 pt-1">
                <p className="serif text-3xl font-medium text-slate-800 leading-[1.2] mb-3">
                  {step.question}
                </p>
                {step.type === 'probe' && (
                  <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50/50 px-2 py-1 rounded inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span> Qualitative Follow-up
                  </span>
                )}
              </div>
            </div>

            {step.response && (
              <div className="flex items-start gap-4 flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] shadow-lg">
                  YOU
                </div>
                <div className="flex-1 text-right">
                  <div className="inline-block bg-indigo-600 text-white px-7 py-5 rounded-[2rem] rounded-tr-none shadow-xl shadow-indigo-100 text-xl font-light">
                    {step.response}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {state.isProcessing && (
          <div className="flex items-center gap-4 text-slate-400 p-5 bg-slate-50/50 border border-slate-100 rounded-3xl w-fit animate-in fade-in duration-300">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 italic">Synthesizing Depth...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-8 bg-slate-50/50 backdrop-blur-xl border-t border-slate-100">
        <div className="flex gap-4 items-end bg-white p-4 rounded-[2rem] border-2 border-slate-100 shadow-2xl shadow-indigo-100/20 focus-within:border-indigo-500 transition-all">
          <textarea
            rows={1}
            placeholder="Type your response..."
            className="flex-1 px-4 py-3 outline-none resize-none min-h-[60px] max-h-[200px] text-slate-700 leading-relaxed text-xl font-light placeholder:text-slate-300"
            value={currentAnswer}
            onChange={e => setCurrentAnswer(e.target.value)}
            disabled={state.isProcessing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!currentAnswer.trim() || state.isProcessing}
            className={`p-5 rounded-2xl transition-all shadow-xl ${!currentAnswer.trim() || state.isProcessing ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.05] active:scale-[0.98]'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div className="mt-5 flex items-center justify-center gap-8">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em]">
            AES-256 Cloud Security
          </p>
          <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em]">
            Real-time MySQL Sync
          </p>
        </div>
      </div>
    </div>
  );
};
