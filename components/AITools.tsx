import React from 'react';
import { Sparkles, Target, Loader2, AlertCircle } from 'lucide-react';
import { TaskType, AnalysisResult } from '../types';
import { analyzeJobApplication } from '../services/geminiService';
import { ResumeSuggestions } from './ResumeSuggestions';

interface AIToolsProps {
  jobDesc: string;
  resume: string;
  onUpdateResult: (result: AnalysisResult | null) => void;
  savedResult: AnalysisResult | null;
}

export const AITools: React.FC<AIToolsProps> = ({ 
  jobDesc, 
  resume, 
  onUpdateResult,
  savedResult,
}) => {
  const [selectedTask, setSelectedTask] = React.useState<TaskType>('summary');
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobDesc.trim() || !resume.trim()) {
      setError("Please ensure both Job Description and Resume are provided in the 'Overview' tab.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await analyzeJobApplication(jobDesc, resume, selectedTask);
      onUpdateResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Interview task removed from here as it has its own tab
  const tasks: { id: TaskType; label: string; icon: React.ReactNode, desc: string }[] = [
    { 
      id: 'summary', 
      label: 'Tailor Summary', 
      icon: <Sparkles className="w-5 h-5" />,
      desc: "Rewrite summary for this role"
    },
    { 
      id: 'bullets', 
      label: 'Score & Improve', 
      icon: <Target className="w-5 h-5" />,
      desc: "ATS Score & Bullet points"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => setSelectedTask(task.id)}
            className={`
              relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-300 text-left
              ${selectedTask === task.id 
                ? 'border-[#006A71] bg-[#E0F2F1] ring-1 ring-[#006A71]/20 shadow-md shadow-[#B2DFDB]' 
                : 'border-slate-100 bg-white hover:border-[#B2DFDB] hover:bg-[#F0F9FA]'}
            `}
          >
            <div className={`p-2 rounded-lg mb-2 ${selectedTask === task.id ? 'bg-[#006A71] text-white' : 'bg-slate-100 text-slate-500'}`}>
              {task.icon}
            </div>
            <span className={`font-bold text-sm mb-0.5 ${selectedTask === task.id ? 'text-[#006A71]' : 'text-slate-700'}`}>
              {task.label}
            </span>
            <span className="text-xs text-slate-500">{task.desc}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !jobDesc || !resume}
          className={`
            w-full md:w-auto px-10 py-3 rounded-full text-white font-bold shadow-lg transition-all
            flex items-center justify-center gap-2 text-sm
            ${isAnalyzing || !jobDesc || !resume
              ? 'bg-slate-300 cursor-not-allowed shadow-none' 
              : 'bg-[#006A71] hover:bg-[#004D53] hover:scale-[1.02]'}
          `}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Application...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate {tasks.find(t => t.id === selectedTask)?.label}
            </>
          )}
        </button>
        
        {(!jobDesc || !resume) && (
          <p className="mt-3 text-xs text-amber-600 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Please add Job Description and Resume in the Overview tab first.
          </p>
        )}

        {error && (
          <div className="mt-4 w-full bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Results Display */}
      {savedResult && (
        <div className="mt-10 border-t border-slate-200 pt-8">
          <div className="flex items-center gap-2 mb-6">
             <span className="bg-[#E0F2F1] text-[#006A71] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Results</span>
             <h3 className="text-xl font-bold text-slate-900">Application Analysis</h3>
          </div>

          {/* Show results based on what data we have available */}
          {savedResult?.tailoredSummary && (
             <div className="mb-10">
               <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Tailored Summary</h4>
               <ResumeSuggestions summary={savedResult.tailoredSummary} />
             </div>
          )}

          {(savedResult?.bulletImprovements || savedResult?.atsScore !== undefined) && (
             <div className="mb-10">
               <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">ATS Score & Fixes</h4>
               <ResumeSuggestions 
                  improvements={savedResult.bulletImprovements} 
                  atsScore={savedResult.atsScore} 
                  atsScoreSummary={savedResult.atsScoreSummary}
               />
             </div>
          )}
        </div>
      )}

    </div>
  );
};