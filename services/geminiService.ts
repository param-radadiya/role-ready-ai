import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, TaskType } from "../types";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// -- Schemas for different tasks --

const summarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tailoredSummary: {
      type: Type.STRING,
      description: "The new resume summary tailored to the job description, maintaining the original length and format.",
    },
  },
  required: ["tailoredSummary"],
};

const bulletsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    atsScore: {
      type: Type.INTEGER,
      description: "A calculated ATS compatibility score from 0 to 100 based on keyword matching and relevance.",
    },
    atsScoreSummary: {
      type: Type.STRING,
      description: "A concise 2-sentence explanation of the score, highlighting missing keywords or formatting strengths.",
    },
    bulletImprovements: {
      type: Type.ARRAY,
      description: "A list of 3-5 specific bullet points from the resume that can be improved.",
      items: {
        type: Type.OBJECT,
        properties: {
          originalText: { type: Type.STRING, description: "The original bullet point text." },
          improvedText: { type: Type.STRING, description: "The improved, quantified, and action-oriented version." },
          reasoning: { type: Type.STRING, description: "Brief explanation of why the change improves the resume." },
        },
        required: ["originalText", "improvedText", "reasoning"],
      },
    },
  },
  required: ["atsScore", "atsScoreSummary", "bulletImprovements"],
};

const interviewSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    interviewQuestions: {
      type: Type.ARRAY,
      description: "A set of 5-7 highly relevant interview questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          category: { 
            type: Type.STRING, 
            enum: ["Behavioral", "Technical", "Role-Specific"],
            description: "The category of the question."
          },
          question: { type: Type.STRING, description: "The interview question text." },
          difficulty: { 
            type: Type.STRING, 
            enum: ["Easy", "Medium", "Hard"],
            description: "Estimated difficulty level." 
          },
        },
        required: ["category", "question", "difficulty"],
      },
    },
  },
  required: ["interviewQuestions"],
};

export const analyzeJobApplication = async (
  jobDescription: string,
  resumeText: string,
  task: TaskType
): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  let systemInstruction = "";
  let schema: Schema;

  switch (task) {
    case 'summary':
      schema = summarySchema;
      systemInstruction = `
        You are an expert resume writer. 
        Your task is to write a **Tailored Resume Summary**.
        1. Analyze the "Candidate Resume" to understand the candidate's existing summary (or top-level introduction). Note its specific tone, formatting style, and **character length**.
        2. Analyze the "Job Description" to identify key keywords and requirements.
        3. Write a NEW summary that:
           - Is strictly tailored to the Job Description.
           - **CRITICAL**: Must strictly adhere to the same format and approximate character count/length as the original resume's summary. Do not make it significantly longer or shorter.
           - If the original resume has no summary, create a concise, 3-sentence professional summary.
      `;
      break;

    case 'bullets':
      schema = bulletsSchema;
      systemInstruction = `
        You are a technical recruiter and ATS expert.
        Your task is to **Score the Resume** and **Enhance Bullet Points**.
        1. **Calculate ATS Score**: Compare the "Candidate Resume" against the "Job Description". Assign a score (0-100) based on keyword overlap, relevance of experience, and measurable impact.
        2. **Explain Score**: Provide a brief summary explaining the score.
        3. **Enhance Bullets**: Identify weak, vague, or task-based bullet points in the resume. Rewrite 3-5 of them to be result-oriented, quantified (using numbers/metrics), and ATS-friendly.
      `;
      break;

    case 'interview':
      schema = interviewSchema;
      systemInstruction = `
        You are a hiring manager.
        Your task is to **Generate Interview Questions**.
        1. Create a set of 5-7 interview questions that you would ask this specific candidate for this specific role.
        2. Include a mix of Behavioral, Technical, and Role-Specific questions based on gaps in the resume or specific JD requirements.
      `;
      break;
    
    default:
      throw new Error("Invalid task selected.");
  }

  const prompt = `
    Job Description:
    ${jobDescription}

    Candidate Resume:
    ${resumeText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    const data = JSON.parse(text) as AnalysisResult;
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze the application. Please try again.");
  }
};