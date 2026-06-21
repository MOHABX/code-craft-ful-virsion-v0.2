const fs = require('fs');
const path = require('path');
const mDir = path.join(__dirname, 'middlewares');

if (fs.existsSync(mDir)) {
    fs.readdirSync(mDir).forEach(file => {
        let filePath = path.join(mDir, file);
        if (fs.statSync(filePath).isDirectory()) return;
        let content = fs.readFileSync(filePath, 'utf-8');
        let original = content;
        
        content = content.replace(/require\(['"]\.\.\/models\/User['"]\)/g, "require('../User')");
        content = content.replace(/require\(['"]\.\.\/models\/BlockedDevice['"]\)/g, "require('../BlockedDevice')");
        
        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log('Fixed', file);
        }
    });
}
