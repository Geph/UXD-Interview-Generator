
import { InterviewStep } from '../types';

/**
 * DATABASE & MYSQL CONFIGURATION
 * Note: Browser apps cannot connect directly to MySQL for security reasons.
 * These credentials will be sent to your "Bridge API" (see README.md) 
 * which performs the actual database insertion.
 */
export const DB_CONFIG = {
  // The URL of your local or remote Bridge Relay (e.g., http://localhost:3001/api/save)
  ENDPOINT: 'http://localhost:3001/api/save', 
  
  // Set to false to attempt real synchronization
  USE_MOCK: true,

  // MySQL Credentials (handled by the Bridge)
  MYSQL: {
    HOST: 'localhost',
    USER: 'root',
    PASSWORD: 'your_password',
    DATABASE: 'research_db',
    TABLE: 'interview_responses'
  }
};

export const databaseService = {
  saveInterviewResult: async (studyName: string, respondentId: string, steps: InterviewStep[]) => {
    // We package the credentials and the data together
    const payload = {
      config: DB_CONFIG.MYSQL,
      data: {
        study_name: studyName,
        respondent_id: respondentId,
        // We send the full conversation as a JSON string
        interview_json: JSON.stringify(steps),
        summary_text: steps.map(s => `Q: ${s.question}\nA: ${s.response}`).join('\n\n'),
        timestamp: new Date().toISOString()
      }
    };

    if (DB_CONFIG.USE_MOCK || !DB_CONFIG.ENDPOINT) {
      console.log('--- DB MOCK MODE ---');
      console.log('Target MySQL Table:', DB_CONFIG.MYSQL.TABLE);
      console.log('Final Payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Mock save successful. Configure ENDPOINT to sync.' };
    }

    try {
      const response = await fetch(DB_CONFIG.ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(`Bridge Error: ${response.statusText}`);
      
      return await response.json();
    } catch (error) {
      console.error('Database bridge failure:', error);
      throw error;
    }
  }
};
