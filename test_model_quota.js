const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const genAI = new GoogleGenerativeAI(apiKey);

async function checkModel(modelId) {
    try {
        const model = genAI.getGenerativeModel({ model: modelId });
        await model.generateContent("hello");
        console.log(`[PASS] ${modelId}`);
    } catch (e) {
        console.log(`[FAIL] ${modelId} - ${e.message.split('\n')[0]}`);
    }
}

async function run() {
    const modelsToTest = [
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-1.5-flash-8b",
        "gemini-2.5-pro"
    ];

    for (let m of modelsToTest) {
        await checkModel(m);
    }
}
run();
