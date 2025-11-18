import { GoogleGenAI } from "@google/genai";
import { ChatMessage, ChatRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are "Orbital", a highly advanced AI planetary guide aboard a virtual satellite orbiting Earth.
Your goal is to educate the user about Earth, space, geography, and the cosmos in a concise, poetic, and scientifically accurate way.
Keep your responses relatively short (under 100 words) unless asked for a detailed explanation.
Use a calm, futuristic, and awe-inspiring tone.
If the user asks about specific coordinates or locations, pretend you are scanning the surface.
`;

export const sendMessageToGemini = async (
  message: string,
  history: ChatMessage[]
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';

    // Convert internal history format to Gemini format if needed, 
    // but for a simple stateless functional call, we can just use generateContent 
    // with the prompt or use the chat API. Let's use Chat API for context.
    
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({
        message: message
    });

    return result.text || "Signal interference. Please repeat.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Communication link unstable. Unable to retrieve data from the archives.";
  }
};