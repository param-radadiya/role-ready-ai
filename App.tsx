import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ApplicationDetail } from './components/ApplicationDetail';
import { ChatCompanion } from './components/ChatCompanion';
import { JobApplication } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { firestoreService } from './services/firestoreService';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'chat'>('dashboard');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load Data
  const loadApplications = async () => {
    if (!user) {
      setApplications([]);
      return;
    }

    // GUEST MODE: Load from local storage
    if (user.uid === 'guest-user') {
        const saved = localStorage.getItem('guest_applications');
        if (saved) {
            try {
                setApplications(JSON.parse(saved));
            } catch (e) {
                setApplications([]);
            }
        } else {
            setApplications([]);
        }
        return;
    }

    setIsLoadingData(true);
    try {
      const apps = await firestoreService.getApplications(user.uid);
      // Sort locally by date desc
      apps.sort((a, b) => b.createdAt - a.createdAt);
      setApplications([...apps]);
    } catch (e) {
      console.error("Error loading apps:", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user]);

  // Helper to save guest data
  const saveGuestData = (apps: JobApplication[]) => {
      localStorage.setItem('guest_applications', JSON.stringify(apps));
  };

  const handleNewApp = async () => {
    if (!user) return;
    
    const id = Date.now().toString();
    const newApp: JobApplication = {
      id: id,
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
      remarks: '',
      notes: [],
      aiResult: null,
      savedInterviewQuestions: [],
      createdAt: Date.now(),
    };

    // Optimistic Update
    const updatedApps = [newApp, ...applications];
    setApplications(updatedApps);
    setCurrentAppId(newApp.id);

    // GUEST MODE
    if (user.uid === 'guest-user') {
        saveGuestData(updatedApps);
        return;
    }

    try {
      await firestoreService.saveApplication(user.uid, newApp);
    } catch (e) {
      console.error("Error creating app:", e);
      alert("Failed to create application on server");
    }
  };

  const handleUpdateApp = async (updatedApp: JobApplication) => {
    if (!user) return;
    
    // Optimistic update
    const updatedApps = applications.map(app => app.id === updatedApp.id ? updatedApp : app);
    setApplications(updatedApps);

    // GUEST MODE
    if (user.uid === 'guest-user') {
        saveGuestData(updatedApps);
        return;
    }

    try {
      await firestoreService.saveApplication(user.uid, updatedApp);
    } catch (e) {
      console.error("Error updating app:", e);
      // Revert if needed
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!user) return;
    if (currentAppId === id) setCurrentAppId(null);

    // Optimistic delete
    const updatedApps = applications.filter(app => app.id !== id);
    setApplications(updatedApps);

    // GUEST MODE
    if (user.uid === 'guest-user') {
        saveGuestData(updatedApps);
        return;
    }

    try {
      await firestoreService.deleteApplication(user.uid, id);
    } catch (e) {
      console.error("Error deleting app:", e);
      alert("Failed to delete application on server");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F0F9FA]">
        <Loader2 className="w-10 h-10 text-[#006A71] animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Loading JobHuntIQ...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const currentApp = applications.find(a => a.id === currentAppId);

  // Helper to render the main view content
  const renderView = () => {
    if (currentAppId && currentApp) {
      return (
        <ApplicationDetail 
          application={currentApp}
          onUpdate={handleUpdateApp}
          onBack={() => setCurrentAppId(null)}
          onDelete={() => handleDeleteApp(currentApp.id)}
        />
      );
    }

    switch (activeView) {
      case 'chat':
        return <ChatCompanion />;
      case 'dashboard':
      default:
        return (
          <div className="h-full overflow-y-auto">
             <Dashboard 
               applications={applications}
               onSelectApp={setCurrentAppId}
               onNewApp={handleNewApp}
               onDeleteApp={(e, id) => {
                  e.stopPropagation();
                  if(window.confirm("Delete this application?")) handleDeleteApp(id);
               }}
               isLoading={isLoadingData}
             />
             <footer className="py-8 text-center">
                <p className="text-xs text-slate-400 font-medium mb-1">
                  &copy; 2025 JobHuntIQ. Powered by Google Gemini.
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Build by <a href="https://www.linkedin.com/in/param-radadiya-77a4b51a6/" target="_blank" rel="noopener noreferrer" className="text-[#006A71] hover:underline font-bold">Param Radadiya</a>
                </p>
                {user.uid === 'guest-user' && (
                    <p className="text-[10px] text-amber-500 mt-2 font-bold uppercase tracking-wider bg-amber-50 inline-block px-2 py-1 rounded">Guest Mode Active</p>
                )}
             </footer>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F0F9FA] font-sans selection:bg-[#B2DFDB] selection:text-[#004D53] overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <Sidebar 
        applications={applications}
        currentAppId={currentAppId}
        activeView={activeView}
        onSelectApp={setCurrentAppId}
        onChangeView={setActiveView}
        onNewApp={handleNewApp}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
           <span className="font-bold text-[#006A71]">JobHuntIQ</span>
           <button onClick={() => { setCurrentAppId(null); setActiveView('dashboard'); }} className="text-xs font-bold text-[#006A71]">Dashboard</button>
        </div>

        {renderView()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;