
import { InterviewStep } from '../types';

export const DB_CONFIG = {
  // Use http://127.0.0.1 instead of localhost to avoid some browser/node DNS delays
  ENDPOINT: 'http://127.0.0.1:3001/api/save', 
  PING_ENDPOINT: 'http://127.0.0.1:3001/api/health',
  
  USE_MOCK: true,

  MYSQL: {
    HOST: 'localhost',
    USER: 'root',
    PASSWORD: 'your_password',
    DATABASE: 'research_db',
    TABLE: 'interview_responses'
  }
};

export const databaseService = {
  checkConnection: async (): Promise<{ status: 'connected' | 'error' | 'mock'; message: string }> => {
    if (DB_CONFIG.USE_MOCK) return { status: 'mock', message: 'Database is in MOCK mode (simulated sync).' };
    
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(DB_CONFIG.PING_ENDPOINT, { signal: controller.signal });
      clearTimeout(id);
      
      if (response.ok) return { status: 'connected', message: 'Bridge Relay is active and reachable.' };
      return { status: 'error', message: 'Bridge responded with an error.' };
    } catch (e) {
      return { status: 'error', message: 'Bridge Relay unreachable. Ensure node bridge.cjs is running.' };
    }
  },

  saveInterviewResult: async (studyName: string, respondentId: string, steps: InterviewStep[]) => {
    const payload = {
      config: DB_CONFIG.MYSQL,
      data: {
        study_name: studyName,
        respondent_id: respondentId,
        interview_json: JSON.stringify(steps),
        summary_text: steps.map(s => `Q: ${s.question}\nA: ${s.response}`).join('\n\n'),
        timestamp: new Date().toISOString()
      }
    };

    if (DB_CONFIG.USE_MOCK || !DB_CONFIG.ENDPOINT) {
      console.log('--- DB MOCK ---', payload);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Mock save successful.' };
    }

    const response = await fetch(DB_CONFIG.ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(`Bridge Error: ${response.statusText}`);
    return await response.json();
  }
};
