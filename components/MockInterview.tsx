import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, Schema, Type } from '@google/genai';
import { Mic, Square, Play, Volume2, VolumeX, Loader2, Award, Zap, AlertCircle, ArrowLeft, Clock, Save, CheckCircle2, ArrowRight, Edit2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

interface MockInterviewProps {
  role: string;
  company: string;
  jobDescription: string;
  resumeText: string;
  onBack: () => void;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;ci
  timestamp: number;
}

export const MockInterview: React.FC<MockInterviewProps> = ({ role, company, jobDescription, resumeText, onBack }) => {
  // Steps: 'setup' -> 'interview' -> 'feedback'
  const [step, setStep] = useState<'setup' | 'interview' | 'feedback'>('setup');
  const [difficulty, setDifficulty] = useState('Medium');
  const [focusArea, setFocusArea] = useState('');
  
  // Chat & Session State
  const chatSessionRef = useRef<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio / Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  
  // Speech Recognition (for User Transcript)
  const recognitionRef = useRef<any>(null);
  const [transcriptLive, setTranscriptLive] = useState("");
  const transcriptAccumulator = useRef(""); 
  const isRecordingRef = useRef(false);

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  // Feedback State
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // --- TTS Helper ---
  const speakText = (text: string) => {
    if (muted || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // --- Start Interview ---
  const startInterview = async () => {
    setStep('interview');
    setIsProcessing(true);
    setMessages([]);
    
    try {
      // Initialize Chat Session
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `You are Alex, a professional AI Interviewer for the role of ${role} at ${company}.
          
          Context:
          - Difficulty: ${difficulty}
          - Focus Area: ${focusArea}
          - Job Description: ${jobDescription.slice(0, 1000)}...
          
          Instructions:
          1. Ask ONE question at a time.
          2. Wait for the user's answer.
          3. After the answer, briefly acknowledge it, then ask the NEXT question.
          4. Keep questions concise.
          5. Do not provide feedback yet, just conduct the interview.
          
          Start by introducing yourself as Alex and asking the first question.`,
        }
      });

      const response = await chatSessionRef.current.sendMessage({ message: "Start the interview." });
      const text = response.text || "Hello, I am Alex. Let's start the interview.";
      
      addMessage('ai', text);
      setCurrentQuestion(text);
      speakText(text);

    } catch (e) {
      console.error(e);
      setError("Failed to start the interview session.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Recording Logic ---
  const startRecording = async () => {
    stopSpeaking(); // Stop AI if speaking
    setAudioBlob(null);
    setTranscriptLive("");
    transcriptAccumulator.current = "";
    setRecordingTime(0);
    chunksRef.current = [];
    isRecordingRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop()); // Stop mic
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start Timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              transcriptAccumulator.current += event.results[i][0].transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setTranscriptLive(transcriptAccumulator.current + interim);
        };

        // Handle automatic stop/timeouts by restarting if we intend to keep recording
        recognition.onend = () => {
          if (isRecordingRef.current) {
            try {
               recognition.start();
            } catch(e) {
               // Ignore errors if it's already running or fast toggles
            }
          }
        };

        recognition.onerror = (e: any) => {
           console.warn("Speech Recognition Error", e.error);
        };
        
        recognition.start();
        recognitionRef.current = recognition;
      }

    } catch (e) {
      console.error(e);
      setError("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      if (recognitionRef.current) {
         recognitionRef.current.stop();
      }
    }
  };

  // --- Submit Answer & Get Next Question ---
  const submitAnswer = async () => {
    if (!chatSessionRef.current) return;

    // Use the potentially edited transcript
    const userText = transcriptLive.trim();
    if (!userText) {
        alert("Please provide an answer (text or audio) before submitting.");
        return;
    }

    addMessage('user', userText);
    
    setIsProcessing(true);
    setAudioBlob(null); // Clear for next turn

    try {
        // Send transcript to Gemini
        const result = await chatSessionRef.current!.sendMessage({
            message: userText
        });

        const aiResponse = result.text || "Thank you. Moving to the next question.";
        addMessage('ai', aiResponse);
        setCurrentQuestion(aiResponse);
        speakText(aiResponse);
        setIsProcessing(false);
    } catch (e) {
        console.error(e);
        setError("Failed to send answer.");
        setIsProcessing(false);
    }
  };

  const addMessage = (role: 'ai' | 'user', text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, text, timestamp: Date.now() }]);
  };

  // --- Finish Interview ---
  const endInterview = async () => {
    stopSpeaking();
    setStep('feedback');
    setFeedbackLoading(true);

    try {
      // Dump the history to prompt to ensure context is there
      const historyText = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
      
      const prompt = `
        The interview is now finished. 
        Based on the conversation history below, please provide a structured JSON assessment.
        
        Conversation History:
        ${historyText}
        
        Required JSON Structure:
        {
          "scores": { "clarity": number (0-10), "technical_accuracy": number (0-10), "communication": number (0-10) },
          "feedback": { "strengths": string[], "improvements": string[] },
          "summary": "2-3 sentence summary of candidate performance"
        }
        
        Do not output markdown code blocks, just the JSON string.
      `;

      const result = await chatSessionRef.current?.sendMessage({ message: prompt });
      let jsonStr = result?.text || "{}";
      
      // Clean up markdown if present
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        setFeedbackData(JSON.parse(jsonStr));
      } catch (e) {
        console.error("JSON Parse Error", e);
        setFeedbackData(null); 
      }
    } catch (e) {
       console.error(e);
       setError("Failed to generate feedback.");
    } finally {
       setFeedbackLoading(false);
    }
  };

  // --- Views ---

  if (step === 'setup') {
    return (
      <div className="max-w-3xl mx-auto p-8 h-full overflow-y-auto">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Prep
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <div className="w-16 h-16 bg-[#E0F2F1] rounded-2xl flex items-center justify-center mb-6 text-[#006A71]">
              <Mic className="w-8 h-8" />
           </div>
           
           <h1 className="text-3xl font-bold text-slate-900 mb-2">Voice Mock Interview</h1>
           <p className="text-slate-500 mb-8 leading-relaxed">
             Practice with an AI interviewer in a realistic, voice-first environment. 
             The AI will ask questions based on your JD and Resume. 
             You will have time to think, record your answer, and get feedback at the end.
           </p>

           {(!jobDescription || !resumeText) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 mb-6">
                 <AlertCircle className="w-5 h-5" />
                 <p className="text-sm font-medium">Please add a Job Description and Resume in the Overview tab first.</p>
              </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Difficulty</label>
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#006A71]"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Focus Area (Optional)</label>
                  <input 
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    placeholder="e.g. System Design, Soft Skills"
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#006A71]"
                  />
              </div>
           </div>

           <button 
             onClick={startInterview}
             disabled={!jobDescription || !resumeText}
             className="w-full py-4 bg-[#006A71] text-white rounded-xl font-bold hover:bg-[#004D53] transition-colors shadow-lg shadow-teal-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             <Play className="w-5 h-5" /> Start Interview Session
           </button>
        </div>
      </div>
    );
  }

  if (step === 'interview') {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
             <span className="font-bold text-slate-700">Live Interview</span>
             <span className="text-sm text-slate-400">|</span>
             <span className="text-sm text-slate-500">{role}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
               onClick={() => setMuted(!muted)}
               className={`p-2 rounded-full ${muted ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}
               title={muted ? "Unmute AI" : "Mute AI"}
            >
               {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={endInterview}
              className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-lg text-sm font-bold transition-colors"
            >
              End Interview
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
           
           <div className="w-full max-w-3xl space-y-6">
              {/* Transcript / History */}
              <div className="space-y-4 mb-8">
                 {messages.map((msg) => (
                   <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user' 
                        ? 'bg-[#E0F2F1] text-[#006A71] rounded-tr-none' 
                        : 'bg-white border border-slate-200 shadow-sm text-slate-700 rounded-tl-none'
                      }`}>
                         <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                   </div>
                 ))}
                 {isProcessing && (
                   <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                         <Loader2 className="w-4 h-4 text-[#006A71] animate-spin" />
                         <span className="text-xs text-slate-500 font-medium">Alex is thinking...</span>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white border-t border-slate-200 p-6 flex flex-col items-center flex-shrink-0 z-20">
           
           {/* Current Interaction State */}
           <div className="w-full max-w-2xl mb-6 text-center">
             {!isRecording && !audioBlob && !isProcessing && (
               <div className="animate-in fade-in slide-in-from-bottom-2">
                 <p className="text-slate-500 font-medium mb-4">Read the question above. Take your time to think.</p>
                 <button 
                   onClick={startRecording}
                   className="mx-auto flex items-center gap-3 px-8 py-4 bg-[#006A71] hover:bg-[#004D53] text-white rounded-full font-bold shadow-xl shadow-teal-100 transition-transform hover:scale-105"
                 >
                    <Mic className="w-5 h-5" /> Start Answer Recording
                 </button>
                 <p className="text-xs text-slate-400 mt-3">Click to start speaking your answer</p>
               </div>
             )}

             {isRecording && (
               <div className="animate-in fade-in">
                 <div className="flex flex-col items-center gap-3 mb-4">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center relative">
                       <div className="absolute w-full h-full rounded-full border-4 border-red-100 animate-ping"></div>
                       <div className="font-mono text-xl font-bold text-red-600">{recordingTime}s</div>
                    </div>
                    <p className="text-slate-600 font-medium">Recording Answer...</p>
                 </div>
                 
                 {/* Live Transcript Preview */}
                 {transcriptLive && (
                    <div className="mb-6 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 max-w-lg mx-auto italic">
                       "{transcriptLive}..."
                    </div>
                 )}

                 <button 
                   onClick={stopRecording}
                   className="mx-auto flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-full font-bold transition-colors"
                 >
                    <Square className="w-4 h-4 fill-current" /> Stop Recording
                 </button>
               </div>
             )}

             {audioBlob && !isProcessing && (
                <div className="animate-in fade-in w-full">
                   <div className="mb-6 text-left w-full max-w-xl mx-auto">
                       <div className="flex items-center justify-between mb-2">
                           <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                               <Edit2 className="w-4 h-4 text-[#006A71]" /> Review & Edit Transcript
                           </label>
                           <span className="text-xs text-slate-400 italic">Correct any typos before submitting</span>
                       </div>
                       <textarea
                           value={transcriptLive}
                           onChange={(e) => setTranscriptLive(e.target.value)}
                           className="w-full p-4 rounded-xl border border-slate-300 focus:border-[#006A71] focus:ring-4 focus:ring-[#006A71]/10 outline-none text-slate-700 text-sm leading-relaxed min-h-[120px] shadow-sm"
                           placeholder="Your answer will appear here. You can also type manually..."
                       />
                   </div>

                   <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                         <CheckCircle2 className="w-4 h-4" /> Recording Captured
                      </div>
                   </div>
                   <div className="flex gap-3 justify-center">
                     <button 
                       onClick={startRecording}
                       className="px-6 py-3 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors"
                     >
                        Re-record
                     </button>
                     <button 
                       onClick={submitAnswer}
                       className="px-8 py-3 bg-[#006A71] hover:bg-[#004D53] text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                     >
                        Submit Answer & Next <ArrowRight className="w-4 h-4" />
                     </button>
                   </div>
                </div>
             )}
           </div>
        </div>
      </div>
    );
  }

  if (step === 'feedback') {
    return (
      <div className="max-w-4xl mx-auto p-8 h-full overflow-y-auto">
          <div className="mb-6">
             <h1 className="text-3xl font-bold text-slate-900 mb-2">Interview Feedback</h1>
             <p className="text-slate-500">Comprehensive analysis of your performance.</p>
          </div>
          
          {feedbackLoading ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
                  <Loader2 className="w-10 h-10 text-[#006A71] animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Analyzing conversation transcript...</p>
                  <p className="text-xs text-slate-400 mt-2">This may take a few seconds</p>
              </div>
          ) : feedbackData ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  {/* Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(feedbackData.scores || {}).map(([key, score]: [string, any]) => (
                          <div key={key} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                              <div className="text-4xl font-black text-[#006A71] mb-2">{score}<span className="text-lg text-slate-400 font-medium">/10</span></div>
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{key.replace('_', ' ')}</div>
                          </div>
                      ))}
                  </div>

                  {/* Summary */}
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-500" /> Executive Summary
                      </h3>
                      <p className="text-slate-700 leading-relaxed">{feedbackData.summary}</p>
                  </div>

                  {/* Feedback Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                          <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                              <Award className="w-5 h-5" /> Strengths
                          </h3>
                          <ul className="space-y-3">
                              {feedbackData.feedback?.strengths?.map((s: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-emerald-900 text-sm">
                                      <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                                      {s}
                                  </li>
                              ))}
                          </ul>
                      </div>

                      <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                          <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                              <AlertCircle className="w-5 h-5" /> Areas for Improvement
                          </h3>
                          <ul className="space-y-3">
                              {feedbackData.feedback?.improvements?.map((s: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-red-900 text-sm">
                                      <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                      {s}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>

                  {/* Transcript Review (Optional) */}
                  <div className="mt-8 pt-8 border-t border-slate-200">
                     <h3 className="text-lg font-bold text-slate-900 mb-4">Session Transcript</h3>
                     <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {messages.map(msg => (
                          <div key={msg.id} className="text-sm">
                             <span className={`font-bold ${msg.role === 'ai' ? 'text-[#006A71]' : 'text-slate-600'}`}>
                                {msg.role === 'ai' ? 'Interviewer' : 'You'}:
                             </span>
                             <span className="text-slate-600 ml-2">{msg.text}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="flex justify-center pt-8 pb-12">
                      <button 
                        onClick={() => {
                            setStep('setup');
                            setMessages([]);
                            setFeedbackData(null);
                        }}
                        className="px-8 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                      >
                          Start New Session
                      </button>
                      <button
                        onClick={onBack}
                        className="ml-4 px-8 py-3 bg-transparent text-slate-500 font-bold rounded-xl hover:text-slate-700 transition-colors"
                      >
                          Back to Tabs
                      </button>
                  </div>
              </div>
          ) : (
              <div className="text-center text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
                 <p className="font-bold">Failed to load feedback.</p>
                 <p className="text-sm mt-1">Please try again.</p>
                 <button onClick={() => setStep('setup')} className="mt-4 text-red-700 underline">Restart</button>
              </div>
          )}
      </div>
    );
  }

  return <div>Unknown Step</div>;
};