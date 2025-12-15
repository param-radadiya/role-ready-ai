import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, Globe, ExternalLink } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: { title?: string; uri: string }[];
}

export const ChatCompanion: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Chat Session
    try {
      chatSessionRef.current = createChatSession();
      // Add initial greeting
      setMessages([{
        id: 'init',
        role: 'model',
        text: "Hi! I'm your **AI Job Hunt Companion**. \n\nI can help you:\n* Search for the latest jobs 🌍\n* Prepare for interviews 🎤\n* Answer career questions 💡\n\n**What are you looking for today?**"
      }]);
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({
          message: userMsg.text
      });
      
      const responseText = result.text || "I couldn't generate a response. Please try again.";
      
      // Extract Grounding Chunks (Web Sources)
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      let sources: { title?: string; uri: string }[] = [];

      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        });
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        sources: sources.length > 0 ? sources : undefined
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (e) {
      console.error("Chat error:", e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error. Please try asking again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F0F9FA]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Career Companion</h1>
          <p className="text-sm text-slate-500">Live search & interview coach</p>
        </div>
        <div className="bg-blue-50 text-[#006A71] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
           <Globe className="w-3 h-3" />
           Internet Access Enabled
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${
              msg.role === 'user' ? 'bg-[#006A71] text-white' : 'bg-white border border-slate-200 text-[#006A71]'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col max-w-[85%] md:max-w-[70%] space-y-2`}>
               <div className={`p-5 rounded-2xl shadow-sm leading-relaxed ${
                 msg.role === 'user' 
                   ? 'bg-[#006A71] text-white rounded-tr-none' 
                   : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
               }`}>
                 <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-4 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-4 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-bold mb-1 mt-2" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                      a: ({node, ...props}) => <a className="underline hover:text-blue-500 transition-colors" target="_blank" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-4 italic my-3 text-slate-500 bg-slate-50 py-1 rounded-r" {...props} />,
                      code: ({node, ...props}) => <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-200" {...props} />,
                      table: ({node, ...props}) => <div className="overflow-x-auto my-4 border rounded-lg"><table className="w-full text-left text-sm" {...props} /></div>,
                      thead: ({node, ...props}) => <thead className="bg-slate-50 border-b" {...props} />,
                      th: ({node, ...props}) => <th className="px-4 py-2 font-bold text-slate-700" {...props} />,
                      td: ({node, ...props}) => <td className="px-4 py-2 border-t border-slate-100" {...props} />,
                    }}
                 >
                   {msg.text}
                 </ReactMarkdown>
               </div>
               
               {/* Sources Display - Simple Text List */}
               {msg.sources && msg.sources.length > 0 && (
                 <div className="mt-1 px-2">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sources</p>
                     <div className="flex flex-col gap-1">
                         {msg.sources.map((source, idx) => (
                           <a 
                             key={idx} 
                             href={source.uri} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="text-xs text-blue-600 hover:underline flex items-start gap-1.5"
                           >
                             <span className="text-slate-400 font-mono mt-0.5">[{idx + 1}]</span>
                             <span className="truncate max-w-md">{source.title || new URL(source.uri).hostname}</span>
                           </a>
                         ))}
                     </div>
                 </div>
               )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-[#006A71] flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4" />
             </div>
             <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#006A71]" />
                <span className="text-sm text-slate-500 font-medium animate-pulse">Searching & thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about jobs, interview tips, or company info..."
            className="w-full pl-5 pr-14 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#006A71] outline-none resize-none shadow-inner max-h-32 min-h-[60px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`absolute right-2 top-2 p-3 rounded-xl transition-all ${
              !inputValue.trim() || isLoading
                ? 'bg-slate-200 text-slate-400'
                : 'bg-[#006A71] text-white hover:bg-[#004D53] shadow-md'
            }`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          AI can make mistakes. Please double-check job details.
        </p>
      </div>
    </div>
  );
};