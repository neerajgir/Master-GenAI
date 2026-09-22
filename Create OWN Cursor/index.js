import { GoogleGenAI, Type } from "@google/genai/node";
import { exec } from "child_process";
import util from "util";
import os from "os";
import 'dotenv/config';
import readlineSync from "readline-sync";

const platform = os.platform();
const execute = util.promisify(exec);

// BUG FIX: Must pass apiKey explicitly. Empty {} throws
// "An API Key must be set when running in an unspecified environment"
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY in .env");
    console.error("   Get one at https://aistudio.google.com/app/apikey");
    console.error("   Then set GEMINI_API_KEY=AIza... in your .env file");
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Tools execution logic
async function executeCommand({ command }) {
    try {
        const { stdout, stderr } = await execute(command);
        if (stderr) {
            return `Error: ${stderr}`;
        }
        return `Command Executed Successfully: ${stdout}`;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

const commandExecuter = {
    name: "executeCommand",
    description: "Execute a command on the terminal to handle file operations.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            command: {
                type: Type.STRING,
                description: "Terminal/shell command. Ex: mkdir calc, touch index.js"
            }
        },
        required: ["command"]
    }
};

const History = [];

// This function processes the conversation until the AI decides to talk to the user instead of calling tools
async function runAgent() {
    while (true) {
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: History,
            config: {
                systemInstruction: `You are a website builder, which will create the frontend part of the website. You will use the tools provided to you to create the website, using terminal/shell commands.
            you will give terminal/shell command one by one and our tool will execute it.
            Give the command according to the operating system we are using.
            My current user Operating system is: ${platform}.
            Your Job
            1: Analyze the user query
            2: Create the website according to the user query.
            3: Take the necessary action after analyze the query by giving proper command according to the operating system.
            Step By Step Guide
            1: First you have to create a directory for the website.
            2: Then you have to create a file for the website.
            3: Then you have to write the code for the website.
            4: Then you have to run the website.
            5: Fix the error if any.
            `, 
                tools: [{ functionDeclarations: [commandExecuter] }]
            },
        });

        const functionCalls = response.functionCalls;
        const candidate = response.candidates?.[0];

        if (functionCalls && functionCalls.length > 0) {
            // FIX for thought_signature error (Gemini 2.5 thinking models):
            // You MUST preserve the exact model content returned by the API,
            // including thought parts and thoughtSignature. Manually reconstructing
            // { functionCall: { name, args } } drops the signature and causes:
            // "Function call is missing a thought_signature" 400 error.
            // See: https://ai.google.dev/gemini-api/docs/thought-signatures
            if (candidate?.content) {
                History.push(candidate.content);
            } else {
                // fallback - should rarely happen
                History.push({
                    role: "model",
                    parts: functionCalls.map(fc => ({ functionCall: { name: fc.name, args: fc.args } }))
                });
            }

            // Execute all function calls (not just the first one)
            for (const fc of functionCalls) {
                console.log(`\n🤖 Tool Call: Executing "${fc.args.command}"...`);
                const toolResult = await executeCommand(fc.args);
                History.push({
                    role: "user",
                    parts: [{
                        functionResponse: {
                            name: fc.name,
                            response: {
                                output: toolResult 
                            }
                        }
                    }]
                });
            }
            
        } else {
            // No more tool calls; display model response text to user and exit agent execution loop
            // response.text is a getter property in @google/genai v1+
            const text = response.text ?? candidate?.content?.parts?.[0]?.text ?? "(no response)";
            console.log(`\n🤖 AI: ${text}`);
            History.push({
                role: "model",
                parts: [{ text: text }]
            });
            break; 
        }
    }
}

// Main interactive user loop isolated externally
async function startApp() {
    console.log("Website Builder Agent Ready.");
    console.log(`Platform detected: ${platform}`);
    
    while (true) {
        const question = readlineSync.question("\nAsk me anything (or type 'exit'): ");
        if (question.toLowerCase() === "exit") {
            break;
        }

        History.push({
            role: "user",
            parts: [{ text: question }]
        });

        await runAgent();
    }
}

startApp();
