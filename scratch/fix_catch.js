const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

let count = 0;
let fileCount = 0;

walk('c:\\Users\\saura\\Documents\\My Dashboard\\src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace catch (e) {}, catch(err) {}, catch (e) { } etc
    content = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{\s*\}/g, 'catch ($1) { console.error("Error parsing block:", $1); }');
    
    // Replace catch {}
    content = content.replace(/catch\s*\{\s*\}/g, 'catch (error) { console.error("Error parsing block:", error); }');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      fileCount++;
      // Count isn't completely accurate but gives an idea
    }
  }
});

console.log(`Updated catch blocks in ${fileCount} files.`);
