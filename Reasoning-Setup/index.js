import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: ""});

const interaction = await ai.interactions.create({
  model: "gemini-3.5-flash",
  input: "what is dsa",
});

console.log(interaction.output_text);