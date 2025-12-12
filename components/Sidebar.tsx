import React from 'react';
import { LayoutDashboard, Plus, Building2, ChevronRight, LogOut, User } from 'lucide-react';
import { JobApplication } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  applications: JobApplication[];
  currentAppId: string | null;
  onSelectApp: (id: string | null) => void;
  onNewApp: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  applications, 
  currentAppId, 
  onSelectApp,
  onNewApp,
  onLogout
}) => {
  const { user } = useAuth();

  return (
    <div className="w-72 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0 left-0 flex-shrink-0 z-30 hidden md:flex">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectApp(null)}>
           <img 
              src="logo.png" 
              alt="JobIQ" 
              className="h-8 w-auto object-contain" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="hidden text-xl font-bold text-[#006A71] tracking-tight" id="sidebar-logo-text">JobIQ</span>
        </div>
        
        <button
          onClick={onNewApp}
          className="w-full flex items-center justify-center gap-2 bg-[#006A71] hover:bg-[#004D53] text-white py-2.5 px-4 rounded-xl font-semibold transition-all shadow-sm shadow-teal-200"
        >
          <Plus className="w-4 h-4" />
          New Application
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Menu
        </div>
        
        <button
          onClick={() => onSelectApp(null)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentAppId === null 
              ? 'bg-[#E0F2F1] text-[#006A71]' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>

        <div className="mt-8 px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
          <span>My Applications</span>
          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{applications.length}</span>
        </div>

        {applications.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No applications yet. Start tracking your dream jobs!
          </div>
        )}

        <div className="space-y-1">
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => onSelectApp(app.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all group ${
                currentAppId === app.id
                  ? 'bg-white border border-[#006A71] shadow-sm'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className={`
                p-2 rounded-md flex-shrink-0 transition-colors
                ${currentAppId === app.id ? 'bg-[#E0F2F1] text-[#006A71]' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#006A71]'}
              `}>
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate text-sm ${currentAppId === app.id ? 'text-[#006A71]' : 'text-slate-700'}`}>
                  {app.company || 'Untitled Company'}
                </div>
                <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                  {app.role || 'Untitled Role'}
                </div>
              </div>
              {currentAppId === app.id && <ChevronRight className="w-3 h-3 text-[#006A71]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#006A71] font-bold text-xs border border-[#B2DFDB] overflow-hidden">
             {user?.photoURL ? (
               <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4"/>}
               </div>
             )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-700 truncate">{user?.displayName || 'User'}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email || ''}</div>
          </div>
          <button 
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
