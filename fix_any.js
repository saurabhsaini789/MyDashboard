const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // e: any -> e: React.SyntheticEvent | any
  // But actually we can just find typical catch blocks, event handlers, and forEach maps.
  // 1. catch (e: any) -> catch (e: unknown)
  content = content.replace(/catch \((?:e|err|error): any\)/g, match => match.replace(': any', ': unknown'));
  
  // 2. (e: any) => in handlers.
  content = content.replace(/handle[a-zA-Z]+\(e: any/g, match => match.replace(': any', ': React.ChangeEvent<any> | React.FormEvent<any> | any')); // partial fix, maybe better to just remove : any and let it infer? Or use any for now but we need to remove the exact string `any`.
  
  // To deal with all explicit `any` without breaking compilation too badly, using `unknown` or `Record<string, unknown>` is a common strategy, but it requires Type Guards.
  // A safer structural replacement for JSON.parse items is `(item: Record<string, any>)` which still uses any, so maybe `(item: Record<string, unknown>)`.
  
  // Actually, replacing all `: any` with `: any /* eslint-disable-next-line @typescript-eslint/no-explicit-any */`
  // Wait, no, the user wants us to FIX them, not disable them.
  // "This breaks the type-safety rules of TypeScript, making the project vulnerable to runtime type errors."
  
  // Let's replace common `let variable: any` with `let variable: unknown`
  // And `(item: any)` -> `(item: Record<string, unknown>)`
  content = content.replace(/\(item: any\)/g, '(item: Record<string, unknown>)');
  content = content.replace(/\(e: any\)/g, '(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | React.KeyboardEvent | React.MouseEvent | React.FormEvent | Event | unknown)');
  content = content.replace(/= \(e: any, /g, '= (e: React.SyntheticEvent, ');
  
  // API Models
  content = content.replace(/const data: any /g, 'const data: unknown ');
  content = content.replace(/let newValue: any/g, 'let newValue: string | number | boolean');
  content = content.replace(/let nextMilestone: any/g, 'let nextMilestone: Record<string, unknown> | null');
  content = content.replace(/catch \((.*?): any\)/g, 'catch ($1: unknown)');

  // Fix `(p: any)` and `(h: any)` in filter/map/forEach
  content = content.replace(/\(p: any\)/g, '(p: Record<string, unknown>)');
  content = content.replace(/\(h: any\)/g, '(h: Record<string, unknown>)');
  content = content.replace(/\(entry: any\)/g, '(entry: Record<string, unknown>)');
  content = content.replace(/\(row: any\)/g, '(row: Record<string, unknown>)');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced++;
  }
});
console.log(`Replaced in ${totalReplaced} files.`);
