const fs = require('fs');
const lines = fs.readFileSync('src/store/useAppStore.ts', 'utf8').split('\n');

// Keep 0 to 825 (inclusive) -> lines.slice(0, 826)
// Skip 826 to 901
// Keep 902 to end -> lines.slice(902)

const newLines = [...lines.slice(0, 826), ...lines.slice(902)];

fs.writeFileSync('src/store/useAppStore.ts', newLines.join('\n'));
console.log('Fixed useAppStore.ts!');
