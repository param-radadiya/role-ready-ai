import React from 'react';
import { MessageSquare } from 'lucide-react';
import { InterviewQuestion } from '../types';

interface InterviewPrepProps {
  questions: InterviewQuestion[];
}

export const InterviewPrep: React.FC<InterviewPrepProps> = ({ questions }) => {

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Hard': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Behavioral': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Technical': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Role-Specific': return 'bg-sky-100 text-sky-700 border-sky-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
      <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
        <h2 className="text-xl font-bold text-blue-900 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
             <MessageSquare className="w-5 h-5 text-blue-700" />
          </div>
          Interview Questions
        </h2>
      </div>

      <div className="divide-y divide-slate-100">
        {questions.map((q, idx) => {
          return (
            <div key={q.id} className="p-8 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                  {idx + 1}
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getCategoryColor(q.category)}`}>
                    {q.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getDifficultyColor(q.difficulty)}`}>
                    {q.difficulty}
                  </span>
                </div>
              </div>
              <h3 className="text-slate-800 font-medium leading-relaxed text-lg pl-9">{q.question}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
};