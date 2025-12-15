
export type TaskType = 'summary' | 'bullets' | 'interview';

export interface BulletImprovement {
  originalText: string;
  improvedText: string;
  reasoning: string;
}

export interface InterviewQuestion {
  id: string; // Unique ID for UI handling
  category: 'Behavioral' | 'Technical' | 'Role-Specific';
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  userAnswer?: string; // For local state
}

export interface AnalysisResult {
  tailoredSummary?: string;
  bulletImprovements?: BulletImprovement[];
  interviewQuestions?: Omit<InterviewQuestion, 'id' | 'userAnswer'>[];
  atsScore?: number;
  atsScoreSummary?: string;
}

export type ApplicationStatus = 'Wishlist' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Accepted';

export interface RecruiterInfo {
  name: string;
  designation: string;
  email: string;
  linkedin: string;
  phone: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  location: string;
  dateApplied: string;
  jobLink: string;
  ctc: string;
  status: ApplicationStatus;
  jobDescription: string;
  resumeText: string; // The tailored resume for this job
  recruiter: RecruiterInfo;
  remarks?: string; // Deprecated, keeping for backward compatibility
  notes?: Note[]; // New structured notes
  
  // Persisted AI Results
  aiResult: AnalysisResult | null;
  savedInterviewQuestions: InterviewQuestion[];
  
  createdAt: number;
}
