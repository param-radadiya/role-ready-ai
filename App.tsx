
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ApplicationDetail } from './components/ApplicationDetail';
import { JobApplication, ApplicationStatus } from './types';

const STORAGE_KEY = 'roleready_applications_v1';

const App: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setApplications(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load applications", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  const handleNewApp = () => {
    const newApp: JobApplication = {
      id: Date.now().toString(),
      company: '',
      role: '',
      location: '',
      dateApplied: new Date().toISOString().split('T')[0],
      jobLink: '',
      ctc: '',
      status: 'Wishlist',
      jobDescription: '',
      resumeText: '',
      recruiter: { name: '', designation: '', email: '', linkedin: '', phone: '' },
      aiResult: null,
      savedInterviewQuestions: [],
      createdAt: Date.now(),
    };
    setApplications([newApp, ...applications]);
    setCurrentAppId(newApp.id);
  };

  const handleUpdateApp = (updatedApp: JobApplication) => {
    setApplications(apps => apps.map(app => app.id === updatedApp.id ? updatedApp : app));
  };

  const handleDeleteApp = (id: string) => {
    setApplications(apps => apps.filter(app => app.id !== id));
    if (currentAppId === id) setCurrentAppId(null);
  };

  const currentApp = applications.find(a => a.id === currentAppId);

  return (
    <div className="flex h-screen bg-[#F0F9FA] font-sans selection:bg-[#B2DFDB] selection:text-[#004D53] overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <Sidebar 
        applications={applications}
        currentAppId={currentAppId}
        onSelectApp={setCurrentAppId}
        onNewApp={handleNewApp}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Mobile Header (Only visible on small screens - simplified for now) */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
           <span className="font-bold text-[#006A71]">RoleReadyAI</span>
           <button onClick={() => setCurrentAppId(null)} className="text-xs font-bold text-[#006A71]">Dashboard</button>
        </div>

        {currentAppId && currentApp ? (
          <ApplicationDetail 
            application={currentApp}
            onUpdate={handleUpdateApp}
            onBack={() => setCurrentAppId(null)}
            onDelete={() => handleDeleteApp(currentApp.id)}
          />
        ) : (
          <div className="h-full overflow-y-auto">
             <Dashboard 
               applications={applications}
               onSelectApp={setCurrentAppId}
               onNewApp={handleNewApp}
               onDeleteApp={(e, id) => {
                  e.stopPropagation();
                  if(window.confirm("Delete this application?")) handleDeleteApp(id);
               }}
             />
             
             {/* Simple Footer for Dashboard view */}
             <footer className="py-8 text-center text-slate-400 text-xs">
                &copy; 2025 RoleReadyAI. Powered by Google Gemini.
             </footer>
          </div>
        )}
      </main>

    </div>
  );
};

export default App;
