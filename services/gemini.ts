
import { GoogleGenAI, Type } from "@google/genai";
import { StudyConfig, InterviewStep, AIResponse, CoreQuestion } from "../types";

/**
 * Helper to get the AI instance safely.
 * This prevents the app from crashing on load if the API_KEY is missing.
 */
const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const SYSTEM_INSTRUCTION = `
You are a world-class qualitative research interviewer. 
Your goal is to elicit deep, detailed, and meaningful insights from the respondent.

STRATEGY:
1. Use the provided "Core Questions" as your primary milestones.
2. Some questions may have "Predefined Probes" provided by the researcher.
3. After a respondent answers, evaluate if the response is "shallow" or "brief".
4. If shallow, generate a probing follow-up. 
5. Do not move to the next core question until you feel the current topic is explored.
`;

export const getNextInterviewAction = async (
  config: StudyConfig,
  history: InterviewStep[]
): Promise<AIResponse> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      STUDY GOAL: ${config.researchGoal}
      CORE QUESTIONS: ${JSON.stringify(config.coreQuestions)}
      HISTORY: ${JSON.stringify(history)}
    `,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nextQuestion: { type: Type.STRING },
          isProbe: { type: Type.BOOLEAN },
          topicExhausted: { type: Type.BOOLEAN },
          reasoning: { type: Type.STRING },
        },
        required: ["nextQuestion", "isProbe", "topicExhausted", "reasoning"],
      },
    },
  });
  
  return JSON.parse(response.text || "{}") as AIResponse;
};

export const extractGuideFromDocument = async (
  content: string | { mimeType: string; data: string },
  isManualText: boolean = true
): Promise<CoreQuestion[]> => {
  const ai = getAI();
  const prompt = `Extract a structured qualitative research interview guide from this document. 
  Identify the core questions and any specific follow-up probes associated with them.
  Ignore logistics or administrative text.
  Return an array of objects with 'text' (string) and 'predefinedProbes' (array of strings).`;

  const parts = isManualText 
    ? [{ text: prompt + "\n\nDocument:\n" + content }]
    : [{ text: prompt }, { inlineData: content as { mimeType: string; data: string } }];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            predefinedProbes: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["text", "predefinedProbes"],
        },
      },
    },
  });

  const parsed = JSON.parse(response.text || "[]");
  return parsed.map((q: any) => ({
    id: Math.random().toString(36).substr(2, 9),
    text: q.text,
    predefinedProbes: q.predefinedProbes
  }));
};
