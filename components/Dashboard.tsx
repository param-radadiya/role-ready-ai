import React from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { Plus, Briefcase, MapPin, Calendar, ExternalLink, Trash2, Loader2, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  applications: JobApplication[];
  onSelectApp: (id: string) => void;
  onNewApp: () => void;
  onDeleteApp: (e: React.MouseEvent, id: string) => void;
  isLoading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ applications, onSelectApp, onNewApp, onDeleteApp, isLoading }) => {
  const { user } = useAuth();
  
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

  const getWelcomeName = () => {
    if (!user) return 'User';
    if (user.uid === 'guest-user') return 'Guest';
    // Return first name or display name
    return user.displayName?.split(' ')[0] || user.displayName || 'User';
  };

  const handleExport = () => {
    // Define CSV Headers
    const headers = [
      "Application ID",
      "Company",
      "Role",
      "Status",
      "Date Applied",
      "Location",
      "CTC",
      "Job Link",
      "Recruiter Name",
      "Recruiter Title",
      "Recruiter Email",
      "Recruiter LinkedIn",
      "Recruiter Phone",
      "Remarks"
    ];

    // Map Data to CSV Rows
    const rows = applications.map(app => [
      app.id,
      app.company || '',
      app.role || '',
      app.status,
      app.dateApplied,
      app.location || '',
      app.ctc || '',
      app.jobLink || '',
      app.recruiter?.name || '',
      app.recruiter?.designation || '',
      app.recruiter?.email || '',
      app.recruiter?.linkedin || '',
      app.recruiter?.phone || '',
      app.remarks || '' // Ensure remarks are included
    ]);

    // Construct CSV String
    const csvContent = [
      headers.join(','), // Header Row
      ...rows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes to handle commas within fields
          const stringCell = String(cell).replace(/"/g, '""'); 
          return `"${stringCell}"`; 
        }).join(',')
      )
    ].join('\n');

    // Create Blob and Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `JobIQ_Applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-[#006A71] animate-spin mb-4" />
        <p className="text-slate-500">Syncing your applications...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back, {getWelcomeName()}! 👋</h1>
          <p className="text-slate-500">Track, manage, and optimize your job applications.</p>
        </div>
        <div className="flex items-center gap-3">
            <button
            onClick={handleExport}
            disabled={applications.length === 0}
            className={`flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 py-3 px-4 rounded-xl font-bold transition-all shadow-sm ${applications.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Export to Excel/CSV"
            >
            <Download className="w-5 h-5" />
            <span className="hidden md:inline">Export Data</span>
            </button>

            <button
            onClick={onNewApp}
            className="flex items-center justify-center gap-2 bg-[#006A71] hover:bg-[#004D53] text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-lg shadow-teal-200"
            >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Add Application</span>
            <span className="md:hidden">Add</span>
            </button>
        </div>
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