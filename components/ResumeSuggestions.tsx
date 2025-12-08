import React, { useState } from 'react';
import { CheckCircle2, Copy, Sparkles, ArrowRight, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { BulletImprovement } from '../types';

interface ResumeSuggestionsProps {
  summary?: string;
  improvements?: BulletImprovement[];
  atsScore?: number;
  atsScoreSummary?: string;
}

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  // SVG calculations for a semi-circle gauge
  const radius = 80;
  const stroke = 12;
  const circumference = radius * Math.PI;
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  
  // Color based on score
  let colorClass = "text-red-500";
  if (score >= 75) colorClass = "text-emerald-500";
  else if (score >= 50) colorClass = "text-amber-500";

  return (
    <div className="relative flex flex-col items-center justify-center pt-4 pb-0">
      <svg width="200" height="110" viewBox="0 0 200 110" className="overflow-visible filter drop-shadow-md">
        {/* Background Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Score Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-out ${colorClass}`}
        />
      </svg>
      <div className="absolute top-[65px] flex flex-col items-center">
        <span className={`text-4xl font-extrabold tracking-tighter ${colorClass}`}>{score}</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ATS Score</span>
      </div>
    </div>
  );
};

export const ResumeSuggestions: React.FC<ResumeSuggestionsProps> = ({ summary, improvements, atsScore, atsScoreSummary }) => {
  const [showImprovements, setShowImprovements] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Tailored Summary Section */}
      {summary && (
        <div className="bg-white rounded-2xl shadow-lg shadow-violet-100/50 border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100 px-8 py-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-violet-900 flex items-center gap-2.5">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              Tailored Resume Summary
            </h2>
            <button 
              onClick={() => copyToClipboard(summary)}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-violet-700 hover:bg-white hover:shadow-sm transition-all"
            >
              <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" /> Copy
            </button>
          </div>
          <div className="p-8">
            <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-line">{summary}</p>
          </div>
        </div>
      )}

      {/* ATS Score & Improvements Section */}
      {atsScore !== undefined && (
        <div className="bg-white rounded-2xl shadow-lg shadow-violet-100/50 border border-slate-100 overflow-hidden">
           <div className="px-8 py-8 border-b border-slate-50 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-shrink-0 scale-110 transform origin-center">
                 <ScoreGauge score={atsScore} />
              </div>
              <div className="flex-1 text-center md:text-left">
                 <h2 className="text-2xl font-bold text-slate-800 mb-3">Resume Score Analysis</h2>
                 <p className="text-slate-600 text-base leading-relaxed mb-6">
                   {atsScoreSummary}
                 </p>
                 {improvements && improvements.length > 0 && !showImprovements && (
                    <button
                      onClick={() => setShowImprovements(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300 transform hover:-translate-y-0.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      View Enhancements
                    </button>
                 )}
              </div>
           </div>
           
           {/* Improvements List (Collapsible) */}
           {showImprovements && improvements && improvements.length > 0 && (
             <div className="animate-in slide-in-from-top-4 fade-in duration-500 bg-slate-50/50">
               <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Target className="w-5 h-5 text-violet-600" />
                    Recommended Improvements
                  </h3>
                  <button 
                    onClick={() => setShowImprovements(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-violet-600 flex items-center gap-1 uppercase tracking-wide px-3 py-1 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    Close <ChevronUp className="w-3 h-3" />
                  </button>
               </div>
               <div className="divide-y divide-slate-100">
                  {improvements.map((imp, idx) => (
                    <div key={idx} className="p-8 hover:bg-white transition-colors group">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Before */}
                        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                          <span className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 block">Original</span>
                          <p className="text-slate-600 text-sm leading-relaxed">{imp.originalText}</p>
                        </div>

                        {/* Arrow for Desktop */}
                        <div className="hidden lg:flex justify-center items-center h-full pt-10 -mx-8 text-slate-300">
                          <ArrowRight className="w-6 h-6" />
                        </div>

                        {/* After */}
                        <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Improved</span>
                            <button 
                              onClick={() => copyToClipboard(imp.improvedText)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-emerald-800"
                              title="Copy Improved Bullet"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-slate-800 font-medium text-sm leading-relaxed">{imp.improvedText}</p>
                          <div className="mt-4 flex items-start gap-2 text-xs text-emerald-800 bg-emerald-100/50 p-3 rounded-lg">
                            <span className="font-bold uppercase tracking-wider text-[10px] mt-0.5">Why:</span>
                            {imp.reasoning}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
             </div>
           )}
        </div>
      )}
      
      {/* Fallback */}
      {!atsScore && improvements && improvements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Bullet Point Enhancements
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {improvements.map((imp, idx) => (
              <div key={idx} className="p-8 hover:bg-slate-50 transition-colors group">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="bg-red-50/50 p-5 rounded-xl border border-red-100">
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 block">Before</span>
                    <p className="text-slate-600 text-sm">{imp.originalText}</p>
                  </div>
                  <div className="hidden lg:flex justify-center items-center h-full pt-10 -mx-8 text-slate-300">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">After</span>
                      <button onClick={() => copyToClipboard(imp.improvedText)} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-emerald-800"><Copy className="w-4 h-4" /></button>
                    </div>
                    <p className="text-slate-800 font-medium text-sm">{imp.improvedText}</p>
                    <p className="mt-3 text-xs text-emerald-700 italic border-t border-emerald-100 pt-2">Why: {imp.reasoning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};