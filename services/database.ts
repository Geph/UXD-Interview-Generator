
import { InterviewStep, StudyConfig } from '../types';

export const DB_CONFIG = {
  ENDPOINT: './bridge.php', 
  PING_ENDPOINT: './bridge.php', 
  USE_MOCK: false, 

  MYSQL: {
    HOST: 'localhost',
    USER: 'root',
    PASSWORD: 'your_password',
    DATABASE: 'research_db'
  }
};

export const databaseService = {
  checkConnection: async (): Promise<{ status: 'connected' | 'error' | 'mock'; message: string }> => {
    if (DB_CONFIG.USE_MOCK) return { status: 'mock', message: 'Database is in MOCK mode.' };
    
    try {
      const response = await fetch(DB_CONFIG.PING_ENDPOINT);
      if (response.ok) return { status: 'connected', message: 'Bridge Relay is active.' };
      return { status: 'error', message: 'Bridge error: ' + response.status };
    } catch (e) {
      return { status: 'error', message: 'Bridge unreachable. Check if bridge.php is uploaded.' };
    }
  },

  saveStudyConfig: async (config: StudyConfig) => {
    const payload = {
      type: 'study',
      config: DB_CONFIG.MYSQL,
      data: {
        name: config.studyName,
        goal: config.researchGoal,
        questions_json: JSON.stringify(config.coreQuestions),
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    };

    if (DB_CONFIG.USE_MOCK) return { success: true };

    const response = await fetch(DB_CONFIG.ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save study config');
    }
    return await response.json();
  },

  saveInterviewResult: async (studyName: string, respondentId: string, steps: InterviewStep[]) => {
    const payload = {
      type: 'response',
      config: DB_CONFIG.MYSQL,
      data: {
        study_name: studyName,
        respondent_id: respondentId,
        interview_json: JSON.stringify(steps),
        summary_text: steps.map(s => `Q: ${s.question}\nA: ${s.response}`).join('\n\n'),
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    };

    if (DB_CONFIG.USE_MOCK) return { success: true };

    const response = await fetch(DB_CONFIG.ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save response');
    }
    return await response.json();
  }
};
