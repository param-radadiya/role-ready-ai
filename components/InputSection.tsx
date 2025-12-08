import React, { useRef, useState } from 'react';
import { Upload, FileText, Briefcase, Loader2, AlertCircle, Sparkles, Target, MessageSquare } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { TaskType } from '../types';

// Initialize PDF.js worker securely
const pdfjs: any = pdfjsLib;
// Use default export if available (common in some bundlers/ESM)
const pdfDocLib = pdfjs.default || pdfjs;

// Ensure GlobalWorkerOptions exists before assignment
if (pdfDocLib.GlobalWorkerOptions) {
  // Use cdnjs for the worker script as it is reliable for direct browser loading via importScripts
  pdfDocLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface InputSectionProps {
  jobDesc: string;
  setJobDesc: (val: string) => void;
  resume: string;
  setResume: (val: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  selectedTask: TaskType;
  setSelectedTask: (task: TaskType) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  jobDesc,
  setJobDesc,
  resume,
  setResume,
  onAnalyze,
  isAnalyzing,
  selectedTask,
  setSelectedTask,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Ensure we use the correct lib reference that has getDocument
      const loadingTask = pdfDocLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        
        // Attempt to extract links from annotations
        const annotations = await page.getAnnotations();
        const links = annotations
          .filter((a: any) => (a.subtype === 'Link' || a.url) && a.url)
          .map((a: any) => a.url);
        
        fullText += pageText + "\n";
        
        if (links.length > 0) {
          fullText += `\n[Links found on page ${i}: ${links.join(', ')}]\n`;
        }
      }
      return fullText;
    } catch (e: any) {
      console.error("PDF extraction error", e);
      throw new Error("Could not parse PDF. Please ensure it is a valid text-based PDF.");
    }
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const mammothLib: any = mammoth;
    
    // Use convertToHtml to preserve links
    const convertToHtml = mammothLib.convertToHtml || mammothLib.default?.convertToHtml;
    
    if (!convertToHtml) {
      throw new Error("Mammoth library not initialized correctly");
    }

    const result = await convertToHtml({ arrayBuffer });
    const html = result.value;
    
    // Parse HTML to inject links next to text
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Append URL in brackets to anchor tags
    doc.querySelectorAll('a').forEach(a => {
      if (a.href) {
        a.textContent = `${a.textContent} [${a.href}]`;
      }
    });

    return doc.body.innerText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileProcessing(true);
    setFileError(null);

    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractTextFromPdf(file);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        file.name.endsWith('.docx')
      ) {
        text = await extractTextFromDocx(file);
      } else {
        text = await file.text();
      }
      
      if (!text.trim()) throw new Error("Could not extract text from this file.");
      setResume(text);
    } catch (err: any) {
      console.error("File parsing error:", err);
      setFileError(err.message || "Failed to read file. Please try copying and pasting the text.");
    } finally {
      setIsFileProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isButtonDisabled = !jobDesc.trim() || !resume.trim() || isAnalyzing || isFileProcessing;

  const tasks: { id: TaskType; label: string; icon: React.ReactNode, desc: string }[] = [
    { 
      id: 'summary', 
      label: 'Tailor Summary', 
      icon: <Sparkles className="w-5 h-5" />,
      desc: "Rewrite your summary to match the JD."
    },
    { 
      id: 'bullets', 
      label: 'Score Resume', 
      icon: <Target className="w-5 h-5" />,
      desc: "Improve pointers & ATS score"
    },
    { 
      id: 'interview', 
      label: 'Interview Prep', 
      icon: <MessageSquare className="w-5 h-5" />,
      desc: "Practice tailored questions."
    },
  ];

  const getButtonText = () => {
    if (isAnalyzing) return "Processing...";
    switch(selectedTask) {
      case 'summary': return "Generate Resume Summary";
      case 'bullets': return "Calculate ATS Score";
      case 'interview': return "Generate Interview Questions";
      default: return "Generate";
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Task Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
         <h2 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-4 ml-1">Step 1: Choose your Goal</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task.id)}
                className={`
                  relative flex flex-col items-start p-5 rounded-xl border-2 transition-all duration-300 text-left group
                  ${selectedTask === task.id 
                    ? 'border-blue-700 bg-blue-50/50 ring-1 ring-blue-700/20 shadow-md shadow-blue-100' 
                    : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 hover:shadow-md'}
                `}
              >
                <div className={`
                  p-2.5 rounded-lg mb-3 transition-colors duration-300
                  ${selectedTask === task.id ? 'bg-blue-700 text-white shadow-lg shadow-blue-300' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600'}
                `}>
                  {task.icon}
                </div>
                <span className={`font-bold text-lg mb-1 ${selectedTask === task.id ? 'text-blue-900' : 'text-slate-700'}`}>
                  {task.label}
                </span>
                <span className="text-xs text-slate-500 leading-relaxed">{task.desc}</span>
              </button>
            ))}
         </div>
      </div>

      {/* Input Fields */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-6 ml-1">Step 2: Add Details</h2>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Job Description */}
          <div className="flex-1 flex flex-col group">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 group-focus-within:text-blue-700 transition-colors">
              <Briefcase className="w-4 h-4 text-blue-500" />
              Job Description
            </label>
            <textarea
              className="flex-1 w-full p-5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all min-h-[280px] resize-none bg-slate-50/50 hover:bg-white focus:bg-white placeholder:text-slate-400"
              placeholder="Paste the full job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>

          {/* Resume */}
          <div className="flex-1 flex flex-col group">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 group-focus-within:text-blue-700 transition-colors">
                <FileText className="w-4 h-4 text-emerald-500" />
                Your Resume
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isFileProcessing}
                className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isFileProcessing 
                    ? 'bg-slate-100 text-slate-400 cursor-wait' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800'
                }`}
              >
                {isFileProcessing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3" />
                    Upload PDF/Doc
                  </>
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".txt,.md,.pdf,.docx"
                onChange={handleFileUpload}
              />
            </div>
            <div className="relative flex-1 flex flex-col">
              <textarea
                className={`flex-1 w-full p-5 rounded-xl border focus:ring-4 outline-none text-sm transition-all min-h-[280px] resize-none placeholder:text-slate-400 ${
                  fileError 
                    ? 'border-red-300 bg-red-50 focus:ring-red-100' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-blue-500/10'
                }`}
                placeholder="Paste your resume text here or upload a file..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
              />
              {fileError && (
                 <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-xs text-red-600 font-medium bg-white/95 backdrop-blur shadow-sm p-3 rounded-lg border border-red-200 animate-in fade-in slide-in-from-bottom-2">
                   <AlertCircle className="w-4 h-4 flex-shrink-0" />
                   {fileError}
                 </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={onAnalyze}
            disabled={isButtonDisabled}
            className={`
              w-full md:w-auto px-12 py-4 rounded-full text-white font-bold shadow-xl transition-all transform duration-300
              flex items-center justify-center gap-3 text-base
              ${isButtonDisabled 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-blue-700 hover:bg-blue-800 hover:scale-[1.02] active:scale-[0.98] shadow-blue-200'}
            `}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Application...
              </>
            ) : (
              getButtonText()
            )}
          </button>
        </div>
      </div>
    </div>
  );
};