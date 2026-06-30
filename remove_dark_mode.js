const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, 'html');
const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

let removedCount = 0;

for (const file of files) {
    const filePath = path.join(htmlDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // حذف الزر. قد يمتد لعدة أسطر
    // مثال: <button id="darkModeToggle" ...> ... </button>
    const regex = /<button[^>]*id="darkModeToggle"[^>]*>[\s\S]*?<\/button>/gi;
    if (regex.test(content)) {
        content = content.replace(regex, '');
        fs.writeFileSync(filePath, content, 'utf-8');
        removedCount++;
    }
}

console.log(`Removed darkModeToggle from ${removedCount} HTML files.`);
