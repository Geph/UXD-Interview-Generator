
import { InterviewStep } from '../types';

/**
 * DATABASE CONFIGURATION
 * Update these parameters to point to your live MySQL backend.
 */
export const DB_CONFIG = {
  // Replace this with your actual API endpoint (e.g., https://api.yourdomain.com/v1/interviews)
  ENDPOINT: '', 
  // Set to false when you are ready to send real data to your server
  USE_MOCK: true,
  // Optional: Add headers like Auth tokens here
  HEADERS: {
    'Content-Type': 'application/json',
    // 'Authorization': 'Bearer YOUR_TOKEN'
  }
};

export const databaseService = {
  saveInterviewResult: async (studyName: string, respondentId: string, steps: InterviewStep[]) => {
    const payload = {
      study_name: studyName,
      respondent_id: respondentId,
      interview_data: JSON.stringify(steps),
      created_at: new Date().toISOString()
    };

    if (DB_CONFIG.USE_MOCK || !DB_CONFIG.ENDPOINT) {
      console.log('--- DB MOCK MODE ---');
      console.log('Payload intended for MySQL:', payload);
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true, message: 'Data logged to console (Mock Mode)' };
    }

    try {
      const response = await fetch(DB_CONFIG.ENDPOINT, {
        method: 'POST',
        headers: DB_CONFIG.HEADERS,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      return await response.json();
    } catch (error) {
      console.error('Database sync failed:', error);
      throw error;
    }
  }
};
