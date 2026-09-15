import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: "AQ.Ab8RN6LH9-CsJlkiQXeZLh74PyztUGo7pl4yLYhctrtR5R_9zw"});

const interaction = await ai.interactions.create({
  model: "gemini-3.5-flash",
  input: "what is dsa",
});

console.log(interaction.output_text);