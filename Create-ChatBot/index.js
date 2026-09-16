import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";

const ai = new GoogleGenAI({apiKey: ""});

async function main() {
    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: `You are a helpful assistant,
            Strict rule to follow
            1. You will only answer questions related to the user's coding related questions.
            2. If the user asks anything else, you will respond with "I can't answer that question."
            3. You will not answer any questions that are not related to the coding questions.

            Reply Method: 
            1. Answer everything on the point.
            2. Follow the methodology of first principle.
            `
        },
        history: []
    })
    // const response = await chat.sendMessage({
    //     message: "What is the node?"
    // })
    // console.log(response.text)

    while(true){
        const userInput = readlineSync.question("You: ");
        if(userInput.toLowerCase() === "exit"){
            console.log("AI: Goodbye!");
            break;
        }
        const response = await chat.sendMessage({message: userInput});
        console.log("AI: ", response.text);
    }
}

await main()


// async function main() {
//   try {
//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: "what is current date?", 
//       config: {
//         systemInstruction: `current user name is Neeraj and today date is: ${new Date()}`
//       }
//     });

//     console.log(response.text);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// main();