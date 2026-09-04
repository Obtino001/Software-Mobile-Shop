const fs = require('fs');

const storePath = 'src/store/useAppStore.ts';
const content = fs.readFileSync(storePath, 'utf8');
const lines = content.split('\n');

const firstDrawingsIdx = lines.findIndex((l, idx) => idx > 500 && l.trim() === 'drawings: [],');
const fetchInitialIdx = lines.findIndex((l, idx) => idx > firstDrawingsIdx && l.includes('// --- Initial Data Fetch from Supabase ---'));

console.log('firstDrawingsIdx:', firstDrawingsIdx);
console.log('fetchInitialIdx:', fetchInitialIdx);

if (firstDrawingsIdx !== -1 && fetchInitialIdx !== -1 && fetchInitialIdx > firstDrawingsIdx) {
  const cleanedLines = [
    ...lines.slice(0, firstDrawingsIdx + 1),
    '',
    ...lines.slice(fetchInitialIdx)
  ];
  fs.writeFileSync(storePath, cleanedLines.join('\n'));
  console.log('Cleaned duplicate block successfully!');
} else {
  console.log('Indices not found!');
}
