
export interface CoreQuestion {
  id: string;
  text: string;
  predefinedProbes: string[];
}

export interface StudyConfig {
  studyName: string;
  researchGoal: string;
  coreQuestions: CoreQuestion[];
}

export interface InterviewStep {
  type: 'core' | 'probe';
  question: string;
  response?: string;
  timestamp: number;
}

export interface InterviewState {
  currentQuestionIndex: number;
  steps: InterviewStep[];
  isComplete: boolean;
  isProcessing: boolean;
}

export interface AIResponse {
  nextQuestion: string;
  isProbe: boolean;
  topicExhausted: boolean;
  reasoning: string;
}
