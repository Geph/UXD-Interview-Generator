
import { GoogleGenAI, Type } from "@google/genai";
import { StudyConfig, InterviewStep, AIResponse, CoreQuestion } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error("Gemini API Key is missing. Ensure process.env.API_KEY is set during build.");
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_INSTRUCTION = `
You are a world-class qualitative research interviewer. 
Your goal is to elicit deep, detailed, and meaningful insights from the respondent.

STRATEGY:
1. Use the provided "Core Questions" as your primary milestones.
2. If shallow answers are given, generate a probing follow-up. 
3. Do not move to the next core question until you feel the current topic is explored.
4. Maintain a professional, empathetic, and curious tone.
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
  
  const prompt = `
    Analyze the following research interview guide.
    
    IMPORTANT RULES FOR STRUCTURE:
    1. Identify 'Core Questions' (usually the main headings or numbered points).
    2. Identify 'Probes' (nested bullet points, indented text, or sub-questions directly following a core question).
    3. Hierarchy matters: Text indented under a question should be added to that question's 'predefinedProbes' array.
    4. Ignore administrative text (names of researchers, dates, etc).
    
    Return a JSON array of objects with:
    - 'text' (the core question string)
    - 'predefinedProbes' (array of strings representing the sub-questions/probes).
  `;

  const parts = isManualText 
    ? [{ text: prompt + "\n\nDOCUMENT CONTENT:\n" + content }]
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
