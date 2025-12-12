
import React from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { Plus, Briefcase, MapPin, Calendar, ExternalLink, Trash2 } from 'lucide-react';

interface DashboardProps {
  applications: JobApplication[];
  onSelectApp: (id: string) => void;
  onNewApp: () => void;
  onDeleteApp: (e: React.MouseEvent, id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ applications, onSelectApp, onNewApp, onDeleteApp }) => {
  
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'Applied': return 'bg-blue-100 text-[#006A71] border-blue-200';
      case 'Interviewing': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Offer': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'Accepted': return 'bg-violet-100 text-violet-700 border-violet-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back! 👋</h1>
          <p className="text-slate-500">Track, manage, and optimize your job applications.</p>
        </div>
        <button
          onClick={onNewApp}
          className="flex items-center justify-center gap-2 bg-[#006A71] hover:bg-[#004D53] text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-lg shadow-teal-200"
        >
          <Plus className="w-5 h-5" />
          Add Application
        </button>
      </div>

      {/* Stats Cards (Optional placeholder for future) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Applications</div>
           <div className="text-3xl font-bold text-slate-900">{applications.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active</div>
           <div className="text-3xl font-bold text-[#006A71]">
             {applications.filter(a => ['Applied', 'Interviewing'].includes(a.status)).length}
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Interviews</div>
           <div className="text-3xl font-bold text-amber-500">
             {applications.filter(a => a.status === 'Interviewing').length}
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Offers</div>
           <div className="text-3xl font-bold text-emerald-600">
             {applications.filter(a => a.status === 'Offer' || a.status === 'Accepted').length}
           </div>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Recent Applications</h2>
        
        {applications.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
              <Briefcase className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No applications yet</h3>
            <p className="text-slate-500 mb-6">Start tracking your journey by adding your first job application.</p>
            <button onClick={onNewApp} className="text-[#006A71] font-semibold hover:text-[#004D53]">Create Application</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
              <div 
                key={app.id} 
                onClick={() => onSelectApp(app.id)}
                className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-[#006A71] transition-all cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                     app.company ? 'bg-[#E0F2F1] text-[#006A71]' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {app.company ? app.company.charAt(0).toUpperCase() : <Briefcase className="w-6 h-6" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                    <button 
                      onClick={(e) => onDeleteApp(e, app.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#006A71] transition-colors">
                  {app.role || 'Untitled Role'}
                </h3>
                <div className="text-sm font-medium text-slate-600 mb-4">
                  {app.company || 'Untitled Company'}
                </div>

                <div className="space-y-2.5 text-xs text-slate-500 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {app.location || 'Remote/Unspecified'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Applied: {app.dateApplied || 'N/A'}
                  </div>
                  {app.jobLink && (
                    <div className="flex items-center gap-2 text-[#006A71] hover:underline" onClick={(e) => e.stopPropagation()}>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <a href={app.jobLink} target="_blank" rel="noopener noreferrer">View Job Post</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
