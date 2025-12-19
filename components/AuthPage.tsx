import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, Copy, Check, Info, User, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setUnauthorizedDomain(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login Error:", err);
      let errorMessage = err.message || "Failed to sign in with Google. Please check your configuration.";
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('auth/unauthorized-domain')) {
        const hostname = window.location.hostname;
        setUnauthorizedDomain(hostname);
        errorMessage = "Domain Not Authorized";
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in cancelled.";
      } else if (err.code === 'auth/api-key-not-valid') {
        errorMessage = "API Key not valid. Please check your Firebase Config.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDomain = () => {
    if (unauthorizedDomain) {
      navigator.clipboard.writeText(unauthorizedDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-blue-100 overflow-hidden border border-slate-100">
        <div className="bg-[#006A71] p-10 text-center">
          {/* Refined Rectangular Logo Container with tight padding and reduced height */}
          <div className="w-64 h-24 bg-white rounded-xl flex items-center justify-center mx-auto mb-6 shadow-md overflow-hidden transition-transform hover:scale-[1.01]">
             <img 
                src="https://static.wixstatic.com/media/a89ef7_8d1cbcd6f1dc4a1eb4f268b335998d07~mv2.png" 
                className="w-full h-full object-contain p-2" 
                alt="JobHuntIQ Logo" 
                onError={(e) => { e.currentTarget.style.display='none'; }}
             />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to JobHuntIQ</h1>
          <p className="text-teal-100 text-sm font-medium">Your intelligent AI assistant for career success.</p>
        </div>

        <div className="p-10 flex flex-col items-center">
          <p className="text-slate-500 text-center mb-6 leading-relaxed">
            Sign in to manage your applications, generate tailored resumes, and practice interview questions.
          </p>

          {unauthorizedDomain && (
            <div className="w-full mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left animate-in fade-in">
              <div className="flex items-center gap-2 mb-2">
                 <span className="p-1 bg-amber-100 rounded text-amber-600"><Info className="w-4 h-4" /></span>
                 <h3 className="text-amber-800 font-bold text-sm">Action Required</h3>
              </div>
              <p className="text-amber-700 text-xs mb-3 leading-relaxed">
                Firebase blocks logins from unknown domains. Add this domain to your Authorized Domains in Firebase Console:
              </p>
              <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg p-2 relative group">
                <code className="flex-1 text-xs text-slate-700 break-all font-mono font-semibold select-all">{unauthorizedDomain}</code>
                <button onClick={handleCopyDomain} className="p-1.5 hover:bg-slate-50 rounded-md transition-colors text-slate-500 border border-slate-100">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {error && !unauthorizedDomain && (
            <div className="w-full mb-6 text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg flex flex-col gap-1 border border-red-100 break-words">
              <div className="flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 flex-shrink-0" />
                 <span className="font-bold">Login Failed</span>
              </div>
              <span className="pl-6">{error}</span>
            </div>
          )}

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl border border-slate-200 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3 group"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#006A71]" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>

          <div className="w-full mt-6">
             <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] uppercase font-bold tracking-wider">Internal Preview</span>
                <div className="flex-grow border-t border-slate-100"></div>
             </div>
             <button onClick={loginAsGuest} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold py-3 px-6 rounded-xl border border-dashed border-slate-200 transition-all flex items-center justify-center gap-2 group">
                <User className="w-4 h-4" />
                <span>Use as Guest</span>
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
             </button>
             <p className="text-center text-[10px] text-slate-400 mt-2 font-bold tracking-wide uppercase">Access app features without login</p>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-slate-400 font-medium">
        <p className="mb-1">&copy; 2025 JobHuntIQ. Powered by Google Gemini.</p>
        <p>Build by <a href="https://www.linkedin.com/in/param-radadiya-77a4b51a6/" target="_blank" rel="noopener noreferrer" className="text-[#006A71] hover:underline font-bold">Param Radadiya</a></p>
      </div>
    </div>
  );
};