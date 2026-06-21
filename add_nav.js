const fs = require('fs');
const path = require('path');
const htmlDir = 'c:/Users/mohab/Desktop/Craft-code-main v1.3/html';
const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));
let count = 0;
files.forEach(file => {
    const p = path.join(htmlDir, file);
    let content = fs.readFileSync(p, 'utf8');
    if (!content.includes('nav.js')) {
        content = content.replace('</body>', '    <script src="../script/nav.js" defer></script>\n</body>');
        fs.writeFileSync(p, content);
        console.log('Added nav.js to ' + file);
        count++;
    }
});
console.log('Done modifying ' + count + ' files.');
