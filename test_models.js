const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

async function run() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  const validModels = (data.models || []).filter(m => m.supportedGenerationMethods.includes('generateContent'));
  validModels.forEach(m => console.log(m.name));
}
run();
