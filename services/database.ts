
import { InterviewStep } from '../types';

export const DB_CONFIG = {
  /**
   * BRIDGE CONFIGURATION
   * If using Node.js locally: 'http://127.0.0.1:3001/api/save'
   * If using PHP on server: './bridge.php' (Relative to where index.html is)
   */
  ENDPOINT: './bridge.php', 
  PING_ENDPOINT: './bridge.php', // PHP bridge returns health on GET
  
  USE_MOCK: false, // Set to false to enable actual syncing

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
      // For PHP, a GET request to the same script acts as health check
      const response = await fetch(DB_CONFIG.PING_ENDPOINT, { signal: controller.signal });
      clearTimeout(id);
      
      if (response.ok) return { status: 'connected', message: 'Bridge Relay (PHP) is active.' };
      return { status: 'error', message: 'Bridge responded with an error.' };
    } catch (e) {
      return { status: 'error', message: 'Bridge Relay unreachable. Ensure bridge.php is uploaded.' };
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
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ') // Format for MySQL DATETIME
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
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Bridge Error: ${response.statusText}`);
    }
    return await response.json();
  }
};
