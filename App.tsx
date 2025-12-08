import React, { useState, useRef, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { ResumeSuggestions } from './components/ResumeSuggestions';
import { InterviewPrep } from './components/InterviewPrep';
import { analyzeJobApplication } from './services/geminiService';
import { AnalysisResult, InterviewQuestion, TaskType } from './types';
import { AlertCircle, RefreshCw, Linkedin } from 'lucide-react';

const App: React.FC = () => {
  const [jobDesc, setJobDesc] = useState<string>('');
  const [resume, setResume] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<TaskType>('summary');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setInterviewQuestions([]);

    try {
      const data = await analyzeJobApplication(jobDesc, resume, selectedTask);
      setResult(data);
      
      // Transform questions if they exist in the result
      if (data.interviewQuestions) {
        const questionsWithIds: InterviewQuestion[] = data.interviewQuestions.map((q, index) => ({
          ...q,
          id: `q-${index}-${Date.now()}`,
          userAnswer: ''
        }));
        setInterviewQuestions(questionsWithIds);
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setInterviewQuestions([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getResultHeader = () => {
    switch (selectedTask) {
      case 'summary': return "Tailored Resume Summary";
      case 'bullets': return "Resume Analysis & Score";
      case 'interview': return "Interview Questions";
      default: return "Analysis Results";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <img 
              src="logo.png" 
              alt="RoleReadyAI" 
              className="h-8 md:h-10 w-auto object-contain mb-1" 
              onError={(e) => {
                // Fallback if logo.png is missing: Show text
                e.currentTarget.style.display = 'none';
                const h1 = document.getElementById('fallback-logo-text');
                if (h1) h1.classList.remove('hidden');
              }}
            />
            <h1 id="fallback-logo-text" className="hidden text-2xl font-bold text-slate-900 tracking-tight">RoleReadyAI</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">AI-Powered Application Accelerator</p>
          </div>
          
          <div className="flex items-center gap-4">
            {result && (
              <>
                <button 
                  onClick={handleReset}
                  className="text-sm font-medium text-slate-500 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
                <div className="h-5 w-px bg-slate-300"></div>
              </>
            )}
            <a 
              href="https://www.linkedin.com/in/param-radadiya-77a4b51a6/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-sm font-semibold transition-all"
            >
              <span>Contact</span>
              <Linkedin className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        
        {/* Intro Text */}
        <div className="mb-10 text-center mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Optimize Your Job Application</h2>
          <p className="text-slate-600 text-lg leading-relaxed max-w-none">
            Choose your goal and let AI tailor your resume, sharpen your answers, and get you role-ready.
          </p>
        </div>

        {/* Inputs */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 blur-3xl -z-10 transform -skew-y-3"></div>
          <InputSection 
            jobDesc={jobDesc}
            setJobDesc={setJobDesc}
            resume={resume}
            setResume={setResume}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-in shake shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="space-y-10 mt-16 pt-10 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-8">
            <div className="text-center mb-8">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Result</span>
              <h3 className="text-3xl font-bold text-slate-900 mt-3">{getResultHeader()}</h3>
            </div>
            
            {selectedTask === 'summary' && result.tailoredSummary && (
               <ResumeSuggestions summary={result.tailoredSummary} />
            )}

            {selectedTask === 'bullets' && (result.bulletImprovements || result.atsScore !== undefined) && (
               <ResumeSuggestions 
                  improvements={result.bulletImprovements} 
                  atsScore={result.atsScore} 
                  atsScoreSummary={result.atsScoreSummary}
               />
            )}
            
            {selectedTask === 'interview' && interviewQuestions.length > 0 && (
              <InterviewPrep questions={interviewQuestions} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-12 text-slate-500 text-sm border-t border-slate-200 mt-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <p className="mb-3 font-medium">&copy; 2025 RoleReadyAI. Powered by Google Gemini.</p>
          <p className="flex items-center justify-center gap-1.5">
            Built by <a href="https://www.linkedin.com/in/param-radadiya-77a4b51a6/" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 font-bold hover:underline transition-all">Param Radadiya</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;