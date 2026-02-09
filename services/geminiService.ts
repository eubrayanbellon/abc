import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLessonDetails = async (title: string, context: string): Promise<{ description: string; durationEstimate: string; tags: string[] }> => {
  try {
    const prompt = `
      Create metadata for an online course lesson titled "${title}".
      Context of the course: ${context}.
      
      Please provide:
      1. A catchy, professional description (max 300 characters) in Portuguese.
      2. An estimated duration (e.g., "10:00").
      3. A list of 3 relevant tags.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            durationEstimate: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["description", "durationEstimate", "tags"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      description: result.description || "Descrição não disponível.",
      durationEstimate: result.durationEstimate || "05:00",
      tags: result.tags || ["Curso", "Online"]
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      description: "Adicione uma descrição para esta aula.",
      durationEstimate: "00:00",
      tags: ["Geral"]
    };
  }
};