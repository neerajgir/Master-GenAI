import { GoogleGenAI, Type } from "@google/genai";
import readlineSync from "readline-sync";

// 1. ✅ FIXED: Zero-auth public cryptocurrency fetch function
async function cryptoCurrency({ coin, curr }) {
    try {
        // Normalize common inputs (e.g., 'bitcoin' to its symbol 'BTC')
        let symbol = coin.toLowerCase() === 'bitcoin' ? 'BTC' : coin.toUpperCase();
        let baseCurrency = curr.toUpperCase(); // e.g., 'USD'

        // Using a reliable public exchange engine that doesn't block local dev requests
        const response = await fetch(`https://crypto.com{symbol}_${baseCurrency}`);
        const data = await response.json();
        
        if (!data.result || !data.result.data || data.result.data.length === 0) {
            throw new Error("Invalid response format or unsupported pair");
        }

        // Extract the latest traded market price value
        const currentPrice = data.result.data[0].a; // 'a' stands for the current ask/market price

        return {
            coin: coin,
            currency: curr,
            price: currentPrice || "Not Found"
        };
    } catch (error) {
        // Graceful fallback logger ensures your Node app doesn't drop
        return { error: `Failed to fetch price data: ${error.message}` };
    }
}

async function weather({ city }) {
    try {
        const response = await fetch(`http://weatherapi.com{city}&aqi=no`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        return { error: `Failed to fetch weather: ${error.message}` };
    }
}

// 2. Clear String Map Configuration
const localFunctions = {
    cryptoCurrency: cryptoCurrency,
    weather: weather
};

// 3. Declarative Schema Array Layout matching Gemini Core Engine Specs
const geminiToolsConfig = [
    {
        functionDeclarations: [
            {
                name: "cryptoCurrency",
                description: "Provides the current price of a cryptocurrency.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        coin: {
                            type: Type.STRING,
                            description: "Name of the coin (e.g., bitcoin, ethereum)"
                        },
                        curr: {
                            type: Type.STRING,
                            description: "Target currency code in lowercase (e.g., usd, eur)"
                        }
                    },
                    required: ["coin", "curr"]
                }
            },
            {
                name: "weather",
                description: "Provides the current weather conditions of any specified city.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        city: {
                            type: Type.STRING,
                            description: "Name of the city"
                        }
                    },
                    required: ["city"]
                }
            }
        ]
    }
];

const History = [];
const genAI = new GoogleGenAI({apiKey: ""}); // ✅ Pro Tip: Reads process.env.GEMINI_API_KEY automatically!

async function runAgent() {
    while (true) {
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: History,
            config: { 
                tools: geminiToolsConfig 
            }
        });

        // ✅ FIXED: Safely destructure function call components out of the SDK output array
        if (result.functionCalls && result.functionCalls.length > 0) {
            const functionCall = result.functionCalls[0];
            const { name, args } = functionCall;
            
            console.log(`[Agent Action]: Running system tool '${name}' with params:`, args);
            const response = await localFunctions[name](args);
            
            // Log the call execution intent back to the model history layer
            History.push({
                role: "model",
                parts: [{ functionCall: functionCall }]
            });

            // Log the resolved execution data payload back to the text thread
            History.push({
                role: "user",
                parts: [{
                    functionResponse: {
                        name: name,
                        response: { content: response }
                    }
                }]
            });
            
        } else {
            // Reached conversational completion
            History.push({
                role: "model",
                parts: [{ text: result.text }]
            });
            console.log("\nAgent:", result.text, "\n");
            break; 
        }  
    }
}

// System Execution Loop Start
while (true) {
    const question = readlineSync.question('Ask me anything: ');
    if (question.toLowerCase() === 'exit') break;
    
    History.push({
        role: "user",
        parts: [{ text: question }]
    });
    await runAgent();
}
