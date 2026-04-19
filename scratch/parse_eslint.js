const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('scratch/eslint_output.json', 'utf8'));
  const ruleCounts = {};
  let totalErrors = 0;
  let totalWarnings = 0;
  
  data.forEach(file => {
    totalErrors += file.errorCount;
    totalWarnings += file.warningCount;
    file.messages.forEach(msg => {
      const rule = msg.ruleId || 'unknown';
      ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
    });
  });

  const sortedRules = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]);
  
  console.log('Total Errors:', totalErrors);
  console.log('Total Warnings:', totalWarnings);
  console.log('\nTop Rules Violated:');
  sortedRules.slice(0, 15).forEach(([rule, count]) => {
    console.log(`${count.toString().padStart(4)}: ${rule}`);
  });
  
  console.log('\nFiles with most issues:');
  data.sort((a, b) => (b.errorCount + b.warningCount) - (a.errorCount + a.warningCount));
  data.slice(0, 10).forEach(file => {
    if (file.errorCount + file.warningCount > 0) {
      const name = file.filePath.split(/[/\\]/).pop();
      console.log(`${name}: ${file.errorCount} errors, ${file.warningCount} warnings`);
    }
  });

} catch (e) {
  console.error(e);
}
