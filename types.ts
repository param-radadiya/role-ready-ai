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

export interface AppState {
  jobDescription: string;
  resumeText: string;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
  selectedTask: TaskType;
}