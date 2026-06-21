const fs = require('fs');
const path = require('path');
const rootDir = __dirname;

fs.readdirSync(rootDir).forEach(file => {
    if (!file.endsWith('.js')) return;
    let filePath = path.join(rootDir, file);
    if (fs.statSync(filePath).isDirectory()) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    content = content.replace(/require\(['"]\.\.\/sendEmail['"]\)/g, "require('./sendEmail')");
    content = content.replace(/require\(['"]\.\.\/services\/geminiService['"]\)/g, "require('./geminiService')");
    content = content.replace(/require\(['"]\.\/services\/geminiService['"]\)/g, "require('./geminiService')");
    content = content.replace(/require\(['"]\.\.\/utils\/certificateGenerator['"]\)/g, "require('./certificateGenerator')");
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed', file);
    }
});
