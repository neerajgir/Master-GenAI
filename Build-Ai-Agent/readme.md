# 🤖 GenAI-Learning: AI Agents, Tools & Function Calling — Build Your Own Agent!

> Ye mera personal learning repo hai jahan main **Gemini API + Node.js** se ek real **AI Agent** bananna seekh raha hoon — jo **live crypto prices** aur **weather** fetch kar sakta hai using **Function Calling**! Sab kuch **Hinglish mein**, deep knowledge ke saath! 🚀

---

## 📋 Table of Contents

1. [AI Agents — LLM ko Superpowers Dena](#1-ai-agents--llm-ko-superpowers-dena-)
2. [Tools — Agent ke Haath-Kaarkhan](#2-tools--agent-ke-haath-kaarkhan-)
3. [Function Calling — Sabse Important Concept](#3-function-calling--sabse-important-concept-)
4. [Mera Project — Full Code Walkthrough](#4-mera-project--full-code-walkthrough-)
5. [Diagram Explanations](#5-diagram-explanations-)
6. [Common Bugs & Pro Fixes](#6-common-bugs--pro-fixes-)
7. [Real-Life Usages](#7-real-life-usages-)
8. [Resources](#8-resources-)

---

## 1. AI Agents — LLM ko Superpowers Dena 🦸

### LLM ki Limitation Kya Hai?

Pehle ye samjho ki LLM **akela kya nahi kar sakta**:

```text
❌ LLM nahi kar sakta:
- Live data fetch karna (aaj ka Bitcoin price? aaj ka mausam?)
- Real actions perform karna (email bhejna, file delete karna)
- Tumhare private database ko access karna
- Calculation 100% reliably karna (LLMs math mein hallucinate karte hain!)
- Apni training date ke baad ki koi bhi jaankari dena
```

### Agent = LLM + Tools + Loop 🧠

**AI Agent** ek system hai jahan LLM sirf **"brain"** nahi, **decision-maker** ban jata hai. Wo khud decide karta hai ki:

```text
1. 🤔 Karna KYA hai?        (Reasoning)
2. 🛠️ Kaunsa TOOL use karna hai?  (Action)
3. 👀 Result dekh ke aage KYA karna hai? (Observation)
```

### Chatbot vs Agent — Farak Samjho:

| Feature | Normal Chatbot | AI Agent |
|---------|:---:|:---:|
| Kaam | Sirf text generate karta hai | **Actions perform** karta hai |
| Real-time data | ❌ (training data tak limited) | ✅ Tools se live data |
| Decision making | Nahi | **Khud decide** karta hai kaunsa tool kab use karna hai |
| Multi-step tasks | ❌ | ✅ Ek ke baad ek steps chala sakta hai |
| Example | "Bitcoin kya hai?" explain karega | "Bitcoin ka PRICE batao" → API call karke **live price** dega ✅ |

### The Agent Loop (Sabse Core Concept!) 🔄

Agent ek **while loop** ki tarah kaam karta hai — jise **ReAct pattern** (Reason + Act) kehte hain:

```text
        ┌──────────────────────────────────┐
        │      🤔 THINK (Reason)           │  ← "Mujhe Bitcoin ka price
        │  LLM sochta hai kya karna hai    │     chahiye... price tool
        └──────────────┬───────────────────┘     use karna chahiye!"
                       ▼
        ┌──────────────────────────────────┐
        │      🛠️ ACT (Tool Call)          │  ← cryptoCurrency("bitcoin","usd")
        │  Function call + execute         │
        └──────────────┬───────────────────┘
                       ▼
        ┌──────────────────────────────────┐
        │      👀 OBSERVE (Result)         │  ← { price: "$67,430" }
        │  Result ko wapas LLM ko do       │
        └──────────────┬───────────────────┘
                       ▼
              Aur tool chahiye? ──Yes──► (wapas THINK pe jao 🔄)
                       │
                       No
                       ▼
        ┌──────────────────────────────────┐
        │      ✅ FINAL ANSWER             │  ← "Bitcoin abhi $67,430 ka hai!"
        └──────────────────────────────────┘
```

> 💡 **Key Insight:** Agent ek hi baar mein answer nahi deta. Wo **tool call → result → fir sochna → shayad dusra tool call** — ye cycle **jab tak final answer na mile**, repeat karta hai. Isi loop ko humne code mein `while(true)` se implement kiya hai!

---

## 2. Tools — Agent ke Haath-Kaarkhan 🛠️

### Tools Kya Hote Hain?

Tools = **tumhare likhe hue normal functions** jo agent use kar sakta hai. Koi magic nahi — bas **JavaScript/Python functions** hain jo:
- Kisi API ko call karte hain
- Database se data laate hain
- Calculation karte hain
- Koi bhi real-world action perform karte hain

### Mere Project ke 2 Tools:

```javascript
// 🛠️ TOOL 1: Crypto Price Fetcher
async function cryptoCurrency({ coin, curr }) {
    try {
        let symbol = coin.toLowerCase() === 'bitcoin' ? 'BTC' : coin.toUpperCase();
        let baseCurrency = curr.toUpperCase();

        const response = await fetch(`https://public-api-endpoint/${symbol}_${baseCurrency}`);
        const data = await response.json();

        const currentPrice = data.result.data[0].a; // latest market price

        return {
            coin: coin,
            currency: curr,
            price: currentPrice || "Not Found"
        };
    } catch (error) {
        // Graceful fallback — app crash na ho!
        return { error: `Failed to fetch price data: ${error.message}` };
    }
}

// 🛠️ TOOL 2: Weather Checker
async function weather({ city }) {
    try {
        const response = await fetch(`https://weather-api-endpoint/${city}&aqi=no`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        return { error: `Failed to fetch weather: ${error.message}` };
    }
}
```

### Tools ko Model se Connect Karna — 2 Hisse:

```javascript
// HISSA 1: Actual functions ka map (execution ke liye)
const localFunctions = {
    cryptoCurrency: cryptoCurrency,
    weather: weather
};

// HISSA 2: Declarative schema (model ko batane ke liye KEHNAA kya hai)
const geminiToolsConfig = [
    {
        functionDeclarations: [
            {
                name: "cryptoCurrency",
                description: "Provides the current price of a cryptocurrency.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        coin: { type: Type.STRING, description: "Name of the coin (e.g., bitcoin, ethereum)" },
                        curr: { type: Type.STRING, description: "Target currency code (e.g., usd, eur)" }
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
                        city: { type: Type.STRING, description: "Name of the city" }
                    },
                    required: ["city"]
                }
            }
        ]
    }
];
```

> ⚠️ **Ye samajhna sabse zaroori hai:** Model tumhara function **kabhi execute nahi karta**! Model ko sirf **schema (declaration)** milti hai. Usse pata hota hai "mujhe `cryptoCurrency` naam ka tool available hai jise `coin` aur `curr` chahiye." Execution **tumhare code** mein hota hai!

### `description` Field — Sabse Underrated Cheez! 🏆

Model **sirf description padh ke** decide karta hai ki kaunsa tool kab use karna hai. Isliye:

```text
❌ BAD:  description: "price function"
         (model ko kuch samajh nahi aayega, random calls karega)

✅ GOOD: description: "Provides the CURRENT/LIVE price of any 
         cryptocurrency in any fiat currency."
         (ab model "bitcoin ka price" wale questions pe 
         khud hi ye tool choose karega!)

💡 Tip: Description mein "kab use karna hai" (WHEN to use) 
   clearly likho. Parameter descriptions mein examples do!
```

---

## 3. Function Calling — Sabse Important Concept 📞

### Function Calling Kaise Kaam Karta Hai? (Under the Hood)

Ye 5 steps samajh lo — **poora concept clear ho jayega:**

```text
STEP 1: Tum model ko bhejte ho:
        → User ka question + Tools ki schema (declarations)

STEP 2: Model sochta hai:
        → "Hmm, user ko live price chahiye... mere paas 
           cryptoCurrency tool hai... main call karunga!"

STEP 3: Model WAPAS bhejta hai — text NAHI, balki structured JSON:
        → { name: "cryptoCurrency", args: { coin: "bitcoin", curr: "usd" } }

STEP 4: TUMHARA code us function ko execute karta hai:
        → const result = await localFunctions[name](args);

STEP 5: Result wapas model ko bhejo (functionResponse ke roop mein):
        → Model ab natural language mein final answer banata hai!
```

> 🔑 **Most Important Line:** Model **na hi function chalata hai, na hi API hit karta hai** — wo sirf ek **"intent ka JSON"** return karta hai. Execution puri tarah **tumhari responsibility** hai. Isse hi isse "function calling" kehte hain — model "call karta hai" sirf theoretically!

### Code Snippet — Function Call Detect & Handle Karna:

```javascript
const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: History,
    config: { tools: geminiToolsConfig }
});

// 🔍 Check karo — model ne function call kiya ya final text diya?
if (result.functionCalls && result.functionCalls.length > 0) {
    const functionCall = result.functionCalls[0];
    const { name, args } = functionCall;

    console.log(`[Agent Action]: Running '${name}' with:`, args);

    // ⚡ Execute karo — YE TUM KARTE HO, model nahi!
    const response = await localFunctions[name](args);

    // 📝 History mein functionCall record karo (model ne "kaha" tha)
    History.push({
        role: "model",
        parts: [{ functionCall: functionCall }]
    });

    // 📝 History mein functionResponse record karo (tumne "jawab" diya)
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
    // 🎉 Koi function call nahi — matlab ye FINAL ANSWER hai!
    console.log("Agent:", result.text);
}
```

### History Structure — Function Calling Wali Chat:

```javascript
// Ek complete function-calling turn history mein aise dikhta hai:

const History = [
    // 👤 User ne pucha
    { role: "user", parts: [{ text: "Bitcoin ka price USD mein batao" }] },

    // 🤖 Model ne function call kiya (text nahi!)
    { role: "model", parts: [{ 
        functionCall: { name: "cryptoCurrency", args: { coin: "bitcoin", curr: "usd" } }
    }]},

    // 👤 Tumne (developer ne) result wapas bheja
    { role: "user", parts: [{ 
        functionResponse: { 
            name: "cryptoCurrency",
            response: { content: { coin: "bitcoin", currency: "usd", price: "67430.5" } }
        }
    })]},

    // 🤖 Model ne ab FINAL natural language answer diya
    { role: "model", parts: [{ text: "Bitcoin abhi $67,430.5 ka trade ho raha hai! 📈" }]}
];
```

> ⚠️ **Golden Rule:** `functionCall` aur `functionResponse` **dono** history mein push karna **mandatory** hai. Agar functionResponse push nahi karoge, to agli API call pe **error aayega** — kyunki model expect karta hai ki har call ka jawab history mein ho!

### Agent Loop — Jab Tak Final Answer Na Mile:

```javascript
// Ye loop isliye zaroori hai kyunki model EK request mein 
// MULTIPLE tool calls kar sakta hai!

async function runAgent() {
    while (true) {                              // 🔄 Agent Loop!
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: History,
            config: { tools: geminiToolsConfig }
        });

        if (result.functionCalls && result.functionCalls.length > 0) {
            // 🛠️ Tool call mila → execute karo → result history mein daalo
            // → loop FIR SE chalega (model result dekh ke aage decide karega)
        } else {
            // ✅ Final text mila → user ko dikhao → loop khatam!
            break;
        }
    }
}
```

**Example — Kab loop multiple baar chalta hai:**

```text
User: "Bitcoin ka price aur Delhi ka mausam batao"

Loop Iteration 1: Model → cryptoCurrency("bitcoin","usd") call karta hai
Loop Iteration 2: Model → weather("Delhi") call karta hai
Loop Iteration 3: Model dono results dekh ke combined final answer deta hai ✅
```

---

## 4. Mera Project — Full Code Walkthrough 💻

**Project:** CLI-based AI Agent jo crypto prices + weather fetch karta hai!

### Project Structure:

```text
ai-agent/
├── agent.js          ← Main agent code
├── package.json
└── .env              ← GEMINI_API_KEY yahan rakho (git mein commit MAT karna!)
```

### Setup & Run:

```bash
npm init -y
npm install @google/genai readline-sync dotenv

# .env file banao:
echo "GEMINI_API_KEY=your_key_here" > .env

node agent.js
```

### Sample Output:

```text
Ask me anything: bitcoin ka price usd mein batao
[Agent Action]: Running system tool 'cryptoCurrency' with params: { coin: 'bitcoin', curr: 'usd' }

Agent: Bitcoin (BTC) ka current price USD mein $67,430.50 hai! 📈

Ask me anything: aur mumbai ka mausam?
[Agent Action]: Running system tool 'weather' with params: { city: 'mumbai' }

Agent: Mumbai mein abhi 31°C temperature hai, halki baarish ho rahi hai 🌧️

Ask me anything: exit
```

### Deep Dive — Line by Line Key Concepts:

```javascript
// 1️⃣ History array — multiturn memory (agent isko padh ke context banata hai)
const History = [];

// 2️⃣ generateContent ko HAR request pe pura history + tools config jata hai
const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: History,           // 💬 puri conversation
    config: { 
        tools: geminiToolsConfig // 🛠️ available tools ki schema
    }
});

// 3️⃣ Destructuring — SDK se function call components safely nikalna
const { name, args } = functionCall;
// name = "cryptoCurrency" | args = { coin: "bitcoin", curr: "usd" }

// 4️⃣ Dynamic function execution — map se function nikal ke call karna
const response = await localFunctions[name](args);
// localFunctions["cryptoCurrency"] → cryptoCurrency function
// (args) automatically destructure ho ke { coin, curr } parameters mein jata hai!
```

---

## 5. Diagram Explanations 📊

### 🔄 Complete Agent Flow (Mere Project ka Flow):

```text
┌──────────────┐
│     User     │ "bitcoin ka price batao"
└──────┬───────┘
       ▼
┌─────────────────────────────────────┐
│  History.push({ role: "user",       │  Question history mein
│    parts: [{ text: question }]})    │
└──────┬──────────────────────────────┘
       ▼
┌─────────────────────────────────────┐
│   🔄 runAgent() — while(true) loop   │
│                                     │
│   Gemini API ko bhejo:              │
│   • History (puri conversation)     │
│   • tools: functionDeclarations     │
└──────┬──────────────────────────────┘
       ▼
      ╔══════════════════════════╗
      ║  Model ka response kya?   ║
      ╚═══════╦════════════╦═════╝
              │            │
   functionCalls        text
              │            │
              ▼            ▼
┌───────────────────┐  ┌────────────────────┐
│ ️ Execute karo:  │  │ ✅ Final Answer!   │
│ localFunctions    │  │ History mein push  │
│ [name](args)      │  │ User ko console    │
│                   │  │ pe dikhao + break  │
│ functionCall +    │  └────────────────────┘
│ functionResponse  │
│ dono History mein │──── loop continue 🔄
└───────────────────┘     (wapas API call)
```

### 📞 Function Calling Sequence Diagram:

```text
  Tumhara Code (Node.js)          Gemini Server           Real World
        │                             │                      │
        │  ① History + tools schema   │                      │
        ├────────────────────────────►│                      │
        │                             │                      │
        │  ② functionCall JSON        │                      │
        │◄────────────────────────────┤                      │
        │  { name: "cryptoCurrency",  │   "Main sirf INTENT  │
        │    args: { coin:"bitcoin",  │    deta hoon, execute│
        │             curr:"usd" } }  │    TUM karoge!" 🤝   │
        │                             │                      │
        │  ③ localFunctions[name]()   │                      │
        ├────────────────────────────────────────────────────►
        │                             │              🌐 CoinAPI fetch!
        │  ④ { price: "67430.5" }     │                      │
        │◄────────────────────────────────────────────────────┤
        │                             │                      │
        │  ⑤ functionResponse bhejo   │                      │
        ├────────────────────────────►│                      │
        │                             │                      │
        │  ⑥ Final natural answer     │                      │
        │◄────────────────────────────┤                      │
        │  "Bitcoin $67,430 ka hai!"  │                      │
        ▼                             │                      │
   User ko dikhao! 🎉                 │                      │
```

### 🧩 Schema Structure Breakdown:

```text
functionDeclarations
│
├── name: "cryptoCurrency"          ← unique naam (localFunctions map se match hona chahiye!)
├── description: "Provides the..."  ← model ISI SE decide karta hai tool kab use karna
└── parameters:                     ← function ke arguments ka blueprint
    ├── type: Type.OBJECT           ← pura args ek object hai
    ├── properties:
    │   ├── coin:  { type: Type.STRING, description: "..." }
    │   └── curr:  { type: Type.STRING, description: "..." }
    └── required: ["coin", "curr"]  ← ye do bina model call nahi kar sakta
```

---

## 6. Common Bugs & Pro Fixes 🔧

Maine khud ye galtiyan ki aur seekha — tum bhi bach ke raho! 😅

### Bug 1: Template Literal Syntax galat

```javascript
// ❌ WRONG — ${} missing hai, string literally print hogi!
const response = await fetch(`https://api.example.com{symbol}_${baseCurrency}`);

// ✅ CORRECT — proper interpolation
const response = await fetch(`https://api.example.com/${symbol}_${baseCurrency}`);
```

### Bug 2: API Key hardcode karna

```javascript
// ❌ WRONG — GitHub pe push karte hi key leak! 💀
const genAI = new GoogleGenAI({ apiKey: "AIzaSy..." });

// ✅ CORRECT — environment variable se lo
require('dotenv').config();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// 💡 Pro tip: @google/genai SDK apiKey diya hi na ho to 
//    process.env.GEMINI_API_KEY automatically padh leta hai!
```

### Bug 3: functionResponse history mein push na karna

```javascript
// ❌ WRONG — sirf functionCall push kiya, response nahi
History.push({ role: "model", parts: [{ functionCall }] });
// → agli API call pe error: "function response missing!"

// ✅ CORRECT — dono push karo, proper order mein
History.push({ role: "model", parts: [{ functionCall }] });
History.push({ role: "user", parts: [{ functionResponse: {...} }] });
```

### Bug 4: Tool ke andar error handling na karna

```javascript
// ❌ WRONG — API fail hui to pura agent crash!
async function weather({ city }) {
    const response = await fetch(url);
    return await response.json();  // 404/500 pe THROW karega 💥
}

// ✅ CORRECT — graceful fallback, agent zinda rahega
async function weather({ city }) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        return { error: `Failed: ${error.message}` };  // 🛟 Safe!
    }
}
```

### Pro Improvements (Next Level) 🚀

| Improvement | Kaise? |
|-------------|--------|
| **Max iterations limit** | `while(true)` mein `for (let i=0; i<10; i++)` — infinite loop se bacho |
| **Parallel tool calls** | `result.functionCalls` array mein multiple calls aaye to `Promise.all()` se sab execute karo |
| **Rate limiting** | Tools mein retry logic + exponential backoff daalo |
| **Streaming** | Final answer ko stream karo better UX ke liye |
| **More tools** | Calculator, calendar, email, database query — agent ko aur powerful banao! |

---

## 7. Real-Life Usages 🌍

| Domain | Use Case | Kaunse Tools? |
|--------|----------|---------------|
| 💰 **Finance Bots** | Live stock/crypto prices, portfolio tracking | Market APIs |
| 🌦️ **Weather Assistants** | Real-time weather + travel suggestions | Weather APIs |
| 🛒 **E-commerce Agents** | "Red shoes ₹2000 ke andar dhundo aur order karo" | Search + Cart + Payment APIs |
| 📅 **Scheduling Agents** | "Kal 3 baje meeting set karo" | Calendar APIs |
| 💻 **Coding Agents** | Cursor/Copilot — files padhna, edit karna, commands chalana | File system + terminal tools |
| 🎧 **Customer Support** | Order status check, refund process | CRM + Database tools |
| 🏠 **Smart Home** | "Lights band kar do, AC 24 pe set karo" | IoT device APIs |
| 📊 **Data Analysts** | "Sales data ka chart banao" | SQL + plotting tools |

### Real Example — Multi-Tool Agent in Action:

```text
User: "Main Delhi se Mumbai kal ja raha hoon. Mausam, flight prices 
       aur wahan best places — sab batao."

Agent ki soch (internally):
🤔 "Teen cheezein chahiye... mere paas 3 tools hain..."
   ① weather("Mumbai")           → 🛠️ Tool 1
   ② flightPrice("DEL","BOM")    → 🛠️ Tool 2  
   ③ placesRecommendation("Mumbai") → 🛠️ Tool 3
🤔 "Teeno results mil gaye... ab ek combined answer banata hoon"

Agent: "Mumbai mein kal 29°C, halki baarish 🌧️ — chhata le jao!
        Flights ₹4,500 se shuru ✈️
        Marine Drive aur Gateway of India zaroor dekhna! 🌊"
```

### Industry Examples:

- **OpenAI's ChatGPT Plugins/Tools** → yahi function calling architecture
- **Anthropic's Claude Tool Use** → same concept, same flow
- **Google's Project Astra** → real-world agent with multiple tools
- **Cursor / GitHub Copilot Agent Mode** → code agents using file/terminal tools

---

## 8. Resources 📚

### Official Docs:
- 📖 [Gemini Function Calling Guide](https://ai.google.dev/gemini-api/docs/function-calling) — Complete documentation
- 📖 [@google/genai SDK — GitHub](https://github.com/googleapis/python-genai) / npm package
- 📖 [Google AI Studio](https://aistudio.google.com/) — Bina code tools test karo

### Deep Learning:
- 🎓 [ReAct Paper](https://arxiv.org/abs/2210.03629) — Reasoning + Acting ka original concept
- 🎓 [Toolformer Paper](https://arxiv.org/abs/2302.04761) — LLMs khud tools use karna kaise seekhte hain
- 🎓 [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — Agent design patterns

### Practice Ideas:
- 🔧 Calculator tool add karo (LLM math mein trust mat karo! 😄)
- 🔧 News fetcher tool banao
- 🔧 Multi-step agent: "Delhi mein 3-day trip plan karo" (weather + places + budget tools)
- 🔧 Tool response ko cache karo (same query pe dobara API call na ho)

---

## 📈 Learning Progress

- [x] AI Agents (Think → Act → Observe loop)
- [x] Tools (functions + schema declarations)
- [x] Function Calling (functionCall + functionResponse)
- [x] Agent Loop implementation (while + break)
- [x] History Management (multiturn with tools)
- [x] Diagram Explanations
- [x] Real-Life Usages
- [ ] Parallel Function Calling *(coming soon...)*
- [ ] Streaming Responses *(coming soon...)*
- [ ] Multi-Agent Systems *(coming soon...)*
- [ ] Agent with Memory (Vector DB) *(coming soon...)*

---

## 🤝 Contributing

Ye mera personal learning repo hai, lekin agar koi **concept improve** karna ho ya **galat explanation** dikhe to feel free to raise an issue! Learning together is the best way! 🙌

---

<div align="center">

**"LLM sochta hai, Tool karta hai,
Loop dono ko jodta hai —
Yahi hai Agent ka formula!"** 🤖

⭐ Star this repo if it helped you learn something new!

</div>

---

**Tip:** Agent banane ka sabse achha tarika — pehle **1 tool** ke saath shuru karo, poora flow samjho (functionCall → execute → functionResponse → final answer). Fir tools badhate jao. Complexity aapne aap handle ho jayegi! 🔥