import React, { useState, useRef } from 'react';
import { JobApplication, ApplicationStatus, AnalysisResult, InterviewQuestion, Note } from '../types';
import { MapPin, Calendar, Link as LinkIcon, DollarSign, User, FileText, Briefcase, ChevronLeft, Upload, Loader2, Save, Sparkles, Trash2, Mail, Linkedin, Phone, StickyNote, Plus, X, Video, MessageSquare, Mic, Check, X as XIcon } from 'lucide-react';
import { AITools } from './AITools';
import { MockInterview } from './MockInterview';
import { InterviewPrep } from './InterviewPrep';
import { analyzeJobApplication } from '../services/geminiService';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'ai' | 'interview'>('overview');
  const [interviewSubTab, setInterviewSubTab] = useState<'menu' | 'practice' | 'mock'>('menu');
  
  // File Processing States
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isProcessingJD, setIsProcessingJD] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  // Notes State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Practice Question Generation State
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

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

  // Inline delete handler to avoid window.confirm issues in embedded environments
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleAIResultUpdate = (result: AnalysisResult | null) => {
    // Only update non-question fields here (Summary, Bullets)
    const mergedResult = { ...(application.aiResult || {}), ...(result || {}) };
    onUpdate({
      ...application,
      aiResult: mergedResult
    });
  };

  const handleGenerateQuestions = async () => {
     if (!application.jobDescription || !application.resumeText) return;
     
     setIsGeneratingQuestions(true);
     try {
       const data = await analyzeJobApplication(application.jobDescription, application.resumeText, 'interview');
       if (data.interviewQuestions) {
           const newQuestions = data.interviewQuestions.map((q, index) => ({
               ...q,
               id: `q-${index}-${Date.now()}`,
               userAnswer: ''
           }));
           onUpdate({ ...application, savedInterviewQuestions: newQuestions });
       }
     } catch (e) {
         console.error(e);
         alert("Failed to generate questions.");
     } finally {
         setIsGeneratingQuestions(false);
     }
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;

    const newNote: Note = {
        id: Date.now().toString(),
        title: newNoteTitle.trim() || 'Untitled Note',
        content: newNoteContent.trim(),
        date: new Date().toLocaleDateString()
    };

    const updatedNotes = [newNote, ...(application.notes || [])];
    onUpdate({ ...application, notes: updatedNotes });

    // Reset form
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleDeleteNote = (noteId: string) => {
      const updatedNotes = (application.notes || []).filter(n => n.id !== noteId);
      onUpdate({ ...application, notes: updatedNotes });
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

  const handleJDUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingJD(true);
    try {
      let text = "";
      if (file.type === "application/pdf") text = await extractTextFromPdf(file);
      else if (file.name.endsWith('.docx')) text = await extractTextFromDocx(file);
      else text = await file.text();
      
      onUpdate({ ...application, jobDescription: text });
    } catch (err) {
      alert("Failed to read file.");
    } finally {
      setIsProcessingJD(false);
      if (jdFileInputRef.current) jdFileInputRef.current.value = '';
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
           
           {showDeleteConfirm ? (
             <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-lg border border-red-100 animate-in fade-in slide-in-from-right-4">
               <span className="text-xs font-bold text-red-600 px-1">Sure?</span>
               <button onClick={confirmDelete} className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors" title="Yes, delete">
                  <Check className="w-4 h-4" />
               </button>
               <button onClick={cancelDelete} className="p-1.5 bg-white text-slate-600 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors" title="Cancel">
                  <XIcon className="w-4 h-4" />
               </button>
             </div>
           ) : (
             <button 
               onClick={handleDeleteClick}
               className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
               title="Delete Application"
             >
               <Trash2 className="w-5 h-5" />
             </button>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-6 text-sm font-medium text-slate-500 sticky top-0 z-10 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${activeTab === 'overview' ? 'border-[#006A71] text-[#006A71]' : 'border-transparent hover:text-slate-700'}`}
        >
          <FileText className="w-4 h-4" /> Overview & Data
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${activeTab === 'ai' ? 'border-[#006A71] text-[#006A71]' : 'border-transparent hover:text-slate-700'}`}
        >
          <Sparkles className="w-4 h-4" /> Application Assistant
        </button>
        <button 
          onClick={() => { setActiveTab('interview'); setInterviewSubTab('menu'); }}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${activeTab === 'interview' ? 'border-[#006A71] text-[#006A71]' : 'border-transparent hover:text-slate-700'}`}
        >
          <Mic className="w-4 h-4" /> Interview Prep
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${activeTab === 'notes' ? 'border-[#006A71] text-[#006A71]' : 'border-transparent hover:text-slate-700'}`}
        >
          <StickyNote className="w-4 h-4" /> Remarks & Notes
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
        <div className="max-w-5xl mx-auto h-full">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in pb-10">
              
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

              {/* Job Description & Resume */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#006A71]" /> Job Description
                    </label>
                    <button
                      onClick={() => jdFileInputRef.current?.click()}
                      disabled={isProcessingJD}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                    >
                       {isProcessingJD ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                       {isProcessingJD ? 'Parsing...' : 'Import File'}
                    </button>
                    <input type="file" ref={jdFileInputRef} className="hidden" onChange={handleJDUpload} accept=".pdf,.docx,.txt" />
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

            </div>
          )}

          {/* APPLICATION ASSISTANT TAB */}
          {activeTab === 'ai' && (
            <div className="max-w-4xl mx-auto pb-10">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-slate-900">Application Assistant</h2>
                <p className="text-slate-500 mt-1">Generate tailored content like summaries and bullet points.</p>
              </div>
              
              <AITools 
                jobDesc={application.jobDescription}
                resume={application.resumeText}
                onUpdateResult={handleAIResultUpdate}
                savedResult={application.aiResult}
              />
            </div>
          )}

          {/* INTERVIEW PREP TAB */}
          {activeTab === 'interview' && (
             <div className="h-full">
                 {interviewSubTab === 'menu' && (
                     <div className="max-w-4xl mx-auto py-8">
                         <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-slate-900">Interview Preparation</h2>
                            <p className="text-slate-500 mt-1">Choose how you want to prepare for this role.</p>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Practice Questions Option */}
                             <button 
                                onClick={() => setInterviewSubTab('practice')}
                                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-[#006A71] transition-all text-left group"
                             >
                                 <div className="w-14 h-14 bg-[#E0F2F1] text-[#006A71] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <MessageSquare className="w-7 h-7" />
                                 </div>
                                 <h3 className="text-xl font-bold text-slate-800 mb-2">Practice Questions</h3>
                                 <p className="text-slate-500 text-sm leading-relaxed">
                                     Generate static interview questions based on the Job Description and your Resume. Review them at your own pace.
                                 </p>
                             </button>

                             {/* Mock Interview Option */}
                             <button 
                                onClick={() => setInterviewSubTab('mock')}
                                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-[#006A71] transition-all text-left group"
                             >
                                 <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Mic className="w-7 h-7" />
                                 </div>
                                 <h3 className="text-xl font-bold text-slate-800 mb-2">Live Mock Interview</h3>
                                 <p className="text-slate-500 text-sm leading-relaxed">
                                     Start a real-time voice session with the AI Interviewer. Receive instant feedback on your performance.
                                 </p>
                             </button>
                         </div>
                     </div>
                 )}

                 {interviewSubTab === 'practice' && (
                     <div className="max-w-4xl mx-auto py-6 pb-20">
                         <button onClick={() => setInterviewSubTab('menu')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                             <ChevronLeft className="w-4 h-4" /> Back to Menu
                         </button>
                         
                         <div className="flex items-center justify-between mb-8">
                             <div>
                                 <h2 className="text-2xl font-bold text-slate-900">Practice Q&A Queue</h2>
                                 <p className="text-slate-500">Tailored questions for {application.role || 'this role'}</p>
                             </div>
                             <button
                               onClick={handleGenerateQuestions}
                               disabled={isGeneratingQuestions || !application.jobDescription}
                               className={`
                                 flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all
                                 ${isGeneratingQuestions || !application.jobDescription ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#006A71] hover:bg-[#004D53]'}
                               `}
                             >
                                 {isGeneratingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                 {application.savedInterviewQuestions.length > 0 ? 'Regenerate Questions' : 'Generate Questions'}
                             </button>
                         </div>

                         {!application.jobDescription && (
                             <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 mb-6">
                                 <Sparkles className="w-5 h-5" />
                                 <p className="text-sm font-medium">Please add a Job Description in the Overview tab to generate questions.</p>
                             </div>
                         )}

                         {application.savedInterviewQuestions.length > 0 ? (
                             <InterviewPrep questions={application.savedInterviewQuestions} />
                         ) : (
                             <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                     <MessageSquare className="w-8 h-8 text-slate-300" />
                                 </div>
                                 <p className="text-slate-500 font-medium">No questions generated yet.</p>
                             </div>
                         )}
                     </div>
                 )}

                 {interviewSubTab === 'mock' && (
                     <div className="h-full">
                         <MockInterview 
                            role={application.role}
                            company={application.company}
                            jobDescription={application.jobDescription}
                            resumeText={application.resumeText}
                            onBack={() => setInterviewSubTab('menu')}
                         />
                     </div>
                 )}
             </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
             <div className="max-w-4xl mx-auto animate-in fade-in pb-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Remarks & Notes</h2>
                    <p className="text-slate-500 mt-1">Keep track of interview details, company research, and referrals.</p>
                  </div>
                  {!isAddingNote && (
                    <button 
                      onClick={() => setIsAddingNote(true)}
                      className="flex items-center gap-2 bg-[#006A71] hover:bg-[#004D53] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-teal-100 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add New Note
                    </button>
                  )}
                </div>

                {isAddingNote && (
                   <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md mb-8 animate-in slide-in-from-top-4">
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="text-lg font-bold text-slate-800">Create New Note</h3>
                         <button onClick={() => setIsAddingNote(false)} className="text-slate-400 hover:text-slate-600">
                           <X className="w-5 h-5" />
                         </button>
                      </div>
                      <input 
                        className="w-full p-3 mb-4 text-lg font-semibold border-b border-slate-200 outline-none focus:border-[#006A71] placeholder:text-slate-300"
                        placeholder="Note Title (e.g. Interview Feedback, Referral Code)"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        autoFocus
                      />
                      <textarea 
                        className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#006A71] outline-none min-h-[150px] resize-none mb-4"
                        placeholder="Write your details here..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                      />
                      <div className="flex justify-end gap-3">
                         <button 
                           onClick={() => setIsAddingNote(false)}
                           className="px-4 py-2 text-slate-500 font-semibold hover:bg-slate-50 rounded-lg transition-colors"
                         >
                           Cancel
                         </button>
                         <button 
                           onClick={handleAddNote}
                           disabled={!newNoteTitle.trim() && !newNoteContent.trim()}
                           className={`px-6 py-2 bg-[#006A71] text-white rounded-lg font-bold shadow-sm transition-all ${
                             (!newNoteTitle.trim() && !newNoteContent.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#004D53]'
                           }`}
                         >
                           Save Note
                         </button>
                      </div>
                   </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Fallback for legacy 'remarks' field if it exists and notes are empty */}
                   {(!application.notes || application.notes.length === 0) && application.remarks && (
                      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 relative group">
                        <div className="flex justify-between items-start mb-3">
                           <h4 className="font-bold text-slate-800">General Remarks</h4>
                           <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded">Legacy</span>
                        </div>
                        <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{application.remarks}</p>
                      </div>
                   )}

                   {application.notes && application.notes.length > 0 ? (
                      application.notes.map((note) => (
                        <div key={note.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                           <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Note"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                           <div className="mb-3 pr-8">
                              <h4 className="font-bold text-lg text-slate-800 leading-tight">{note.title}</h4>
                              <span className="text-xs text-slate-400 font-medium">{note.date}</span>
                           </div>
                           <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                              {note.content}
                           </p>
                        </div>
                      ))
                   ) : (
                      !application.remarks && !isAddingNote && (
                        <div className="col-span-full py-12 flex flex-col items-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3">
                              <StickyNote className="w-6 h-6 text-slate-300" />
                           </div>
                           <p className="text-slate-500 font-medium">No notes added yet.</p>
                           <button onClick={() => setIsAddingNote(true)} className="text-[#006A71] font-bold text-sm mt-1 hover:underline">Create your first note</button>
                        </div>
                      )
                   )}
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};