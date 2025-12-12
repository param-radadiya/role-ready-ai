import React, { useState, useRef } from 'react';
import { JobApplication, ApplicationStatus, AnalysisResult, InterviewQuestion } from '../types';
import { MapPin, Calendar, Link as LinkIcon, DollarSign, User, FileText, Briefcase, ChevronLeft, Upload, Loader2, Save, Sparkles, Trash2, Mail, Linkedin, Phone, StickyNote } from 'lucide-react';
import { AITools } from './AITools';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// Initialize PDF.js worker
const pdfjs: any = pdfjsLib;
const pdfDocLib = pdfjs.default || pdfjs;
if (pdfDocLib.GlobalWorkerOptions) {
  pdfDocLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface ApplicationDetailProps {
  application: JobApplication;
  onUpdate: (updatedApp: JobApplication) => void;
  onBack: () => void;
  onDelete: () => void;
}

export const ApplicationDetail: React.FC<ApplicationDetailProps> = ({ application, onUpdate, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai'>('overview');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for auto-saving fields
  const handleFieldChange = (field: keyof JobApplication | keyof JobApplication['recruiter'], value: string) => {
    if (['name', 'designation', 'email', 'linkedin', 'phone'].includes(field as string)) {
      onUpdate({
        ...application,
        recruiter: {
          ...application.recruiter,
          [field]: value
        }
      });
    } else {
      onUpdate({
        ...application,
        [field]: value
      });
    }
  };

  const handleStatusChange = (status: ApplicationStatus) => {
    onUpdate({ ...application, status });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      onDelete();
    }
  };

  const handleAIResultUpdate = (result: AnalysisResult | null, questions: InterviewQuestion[]) => {
    const mergedResult = { ...(application.aiResult || {}), ...(result || {}) };
    const mergedQuestions = questions.length > 0 ? questions : application.savedInterviewQuestions;
    
    onUpdate({
      ...application,
      aiResult: mergedResult,
      savedInterviewQuestions: mergedQuestions
    });
  };

  // --- File Parsing Logic ---
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfDocLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      return fullText;
    } catch (e) {
      console.error(e);
      throw new Error("Could not parse PDF.");
    }
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const mammothLib: any = mammoth;
    const convertToHtml = mammothLib.convertToHtml || mammothLib.default?.convertToHtml;
    if (!convertToHtml) throw new Error("Mammoth library error");
    const result = await convertToHtml({ arrayBuffer });
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.value, 'text/html');
    return doc.body.innerText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    try {
      let text = "";
      if (file.type === "application/pdf") text = await extractTextFromPdf(file);
      else if (file.name.endsWith('.docx')) text = await extractTextFromDocx(file);
      else text = await file.text();
      
      onUpdate({ ...application, resumeText: text });
    } catch (err) {
      alert("Failed to read file.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F0F9FA] overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0 z-20">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
             <input 
               className="text-xl font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-400 w-full max-w-md truncate"
               placeholder="Role Title (e.g. Senior Frontend Engineer)"
               value={application.role}
               onChange={(e) => handleFieldChange('role', e.target.value)}
             />
          </div>
          <div className="flex items-center gap-2">
            <input 
               className="text-sm font-medium text-slate-600 bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-400 w-full max-w-xs truncate"
               placeholder="Company Name"
               value={application.company}
               onChange={(e) => handleFieldChange('company', e.target.value)}
             />
          </div>
        </div>
        <div className="flex items-center gap-3">
           <select 
             value={application.status}
             onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
             className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-[#006A71] focus:border-[#006A71] block p-2.5 font-medium"
           >
             <option value="Wishlist">Wishlist</option>
             <option value="Applied">Applied</option>
             <option value="Interviewing">Interviewing</option>
             <option value="Offer">Offer</option>
             <option value="Rejected">Rejected</option>
             <option value="Accepted">Accepted</option>
           </select>
           
           <button 
             onClick={handleDelete}
             className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
             title="Delete Application"
           >
             <Trash2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-6 text-sm font-medium text-slate-500 sticky top-0 z-10">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'border-[#006A71] text-[#006A71]' : 'border-transparent hover:text-slate-700'}`}
        >
          <FileText className="w-4 h-4" /> Overview & Data
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ai' ? 'border-[#006A71] text-[#006A71]' : 'border-transparent hover:text-slate-700'}`}
        >
          <Sparkles className="w-4 h-4" /> AI Assistant
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in">
              
              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Location */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col group focus-within:ring-2 focus-within:ring-[#006A71]/20">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#006A71] uppercase tracking-wider mb-3">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </label>
                  <input 
                    className="w-full text-base font-medium text-slate-800 bg-[#F0F9FA] border border-transparent rounded-lg p-2.5 focus:bg-white focus:border-[#006A71] outline-none transition-all placeholder:text-slate-300"
                    placeholder="e.g. Remote, NY"
                    value={application.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                  />
                </div>

                {/* Applied Date */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col group focus-within:ring-2 focus-within:ring-[#006A71]/20">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#006A71] uppercase tracking-wider mb-3">
                    <Calendar className="w-3.5 h-3.5" /> Applied Date
                  </label>
                  <input 
                    type="date"
                    className="w-full text-base font-medium text-slate-800 bg-[#F0F9FA] border border-transparent rounded-lg p-2.5 focus:bg-white focus:border-[#006A71] outline-none transition-all"
                    value={application.dateApplied}
                    onChange={(e) => handleFieldChange('dateApplied', e.target.value)}
                  />
                </div>

                {/* CTC */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col group focus-within:ring-2 focus-within:ring-[#006A71]/20">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#006A71] uppercase tracking-wider mb-3">
                    <DollarSign className="w-3.5 h-3.5" /> CTC / Salary
                  </label>
                  <input 
                    className="w-full text-base font-medium text-slate-800 bg-[#F0F9FA] border border-transparent rounded-lg p-2.5 focus:bg-white focus:border-[#006A71] outline-none transition-all placeholder:text-slate-300"
                    placeholder="e.g. $120k"
                    value={application.ctc}
                    onChange={(e) => handleFieldChange('ctc', e.target.value)}
                  />
                </div>

                {/* Job Link */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col group focus-within:ring-2 focus-within:ring-[#006A71]/20">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#006A71] uppercase tracking-wider mb-3">
                    <LinkIcon className="w-3.5 h-3.5" /> Job Link
                  </label>
                  <input 
                    className="w-full text-base font-medium text-slate-800 bg-[#F0F9FA] border border-transparent rounded-lg p-2.5 focus:bg-white focus:border-[#006A71] outline-none transition-all placeholder:text-slate-300"
                    placeholder="https://..."
                    value={application.jobLink}
                    onChange={(e) => handleFieldChange('jobLink', e.target.value)}
                  />
                </div>
              </div>

              {/* Recruiter Info */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 border-dashed border-[#006A71]/30 bg-[#F0F9FA]/30">
                <h3 className="text-sm font-bold text-[#006A71] flex items-center gap-2 mb-6">
                  <User className="w-4 h-4" /> Recruiter Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name and Designation */}
                  <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Name</label>
                       <input 
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006A71] bg-white shadow-sm"
                        placeholder="Recruiter Name"
                        value={application.recruiter.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Designation / Role</label>
                       <input 
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006A71] bg-white shadow-sm"
                        placeholder="e.g. Senior Talent Acquisition"
                        value={application.recruiter.designation}
                        onChange={(e) => handleFieldChange('designation', e.target.value)}
                       />
                     </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Info</h4>
                     <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <input 
                          className="flex-1 p-2 border-b border-slate-200 text-sm outline-none focus:border-[#006A71] bg-transparent"
                          placeholder="Email Address"
                          value={application.recruiter.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                        />
                     </div>
                     <div className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4 text-slate-400" />
                        <input 
                          className="flex-1 p-2 border-b border-slate-200 text-sm outline-none focus:border-[#006A71] bg-transparent"
                          placeholder="LinkedIn URL"
                          value={application.recruiter.linkedin}
                          onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                        />
                     </div>
                     <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <input 
                          className="flex-1 p-2 border-b border-slate-200 text-sm outline-none focus:border-[#006A71] bg-transparent"
                          placeholder="Phone Number"
                          value={application.recruiter.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                        />
                     </div>
                  </div>
                </div>
              </div>

               {/* Private Remarks / Notes Section */}
               <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm group focus-within:ring-2 focus-within:ring-[#006A71]/20">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                   <StickyNote className="w-4 h-4 text-amber-500" />
                   Private Remarks & Notes
                </label>
                <textarea
                  className="w-full p-4 rounded-xl border border-slate-200 bg-amber-50/30 focus:bg-white focus:border-[#006A71] outline-none text-sm min-h-[120px] resize-y placeholder:text-slate-400 transition-colors"
                  placeholder="Add your notes here... (e.g. Referral details, interview experience, company impressions)"
                  value={application.remarks || ''}
                  onChange={(e) => handleFieldChange('remarks', e.target.value)}
                />
              </div>

              {/* Job Description & Resume */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#006A71]" /> Job Description
                    </label>
                  </div>
                  <textarea
                    className="flex-1 w-full p-4 rounded-xl border border-slate-200 focus:border-[#006A71] focus:ring-4 focus:ring-[#006A71]/10 outline-none text-sm min-h-[400px] resize-none bg-white shadow-sm font-mono text-slate-600 leading-relaxed"
                    placeholder="Paste the full job description here to enable AI features..."
                    value={application.jobDescription}
                    onChange={(e) => handleFieldChange('jobDescription', e.target.value)}
                  />
                </div>

                {/* Resume */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" /> Your Resume for this Role
                    </label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingFile}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                    >
                       {isProcessingFile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                       {isProcessingFile ? 'Parsing...' : 'Import File'}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                  </div>
                  <textarea
                    className="flex-1 w-full p-4 rounded-xl border border-slate-200 focus:border-[#006A71] focus:ring-4 focus:ring-[#006A71]/10 outline-none text-sm min-h-[400px] resize-none bg-white shadow-sm font-mono text-slate-600 leading-relaxed"
                    placeholder="Paste your resume content here or upload..."
                    value={application.resumeText}
                    onChange={(e) => handleFieldChange('resumeText', e.target.value)}
                  />
                </div>
              </div>

            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-slate-900">AI Application Assistant</h2>
                <p className="text-slate-500 mt-1">Generate tailored content based on the data in the Overview tab.</p>
              </div>
              
              <AITools 
                jobDesc={application.jobDescription}
                resume={application.resumeText}
                onUpdateResult={handleAIResultUpdate}
                savedResult={application.aiResult}
                savedQuestions={application.savedInterviewQuestions}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};