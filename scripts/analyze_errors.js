const fs = require('fs');

const data = JSON.parse(fs.readFileSync('eslint_output.json', 'utf8'));

const rulesCount = {};
const fileCount = {};

data.forEach(file => {
  if (file.messages.length > 0) {
    if (!fileCount[file.filePath]) {
      fileCount[file.filePath] = 0;
    }
    file.messages.forEach(msg => {
      fileCount[file.filePath]++;
      const ruleId = msg.ruleId || 'unknown';
      rulesCount[ruleId] = (rulesCount[ruleId] || 0) + 1;
    });
  }
});

console.log("RULES:");
Object.entries(rulesCount).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([r, c]) => console.log(`${r}: ${c}`));

console.log("\nFILES WITH MOST ERRORS:");
Object.entries(fileCount).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([f, c]) => console.log(`${f}: ${c}`));

let anyErrors = [];
data.forEach(file => {
  file.messages.forEach(msg => {
    if (msg.ruleId === '@typescript-eslint/no-explicit-any') {
      anyErrors.push(`${file.filePath}:${msg.line}`);
    }
  });
});
console.log(`\nFiles with most 'any' errors: ${anyErrors.length} total. Examples:`);
anyErrors.slice(0, 5).forEach(f => console.log(f));
