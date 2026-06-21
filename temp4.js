const fs = require('fs');
const path = require('path');
const rDir = path.join(__dirname, 'routes');

if (fs.existsSync(rDir)) {
    fs.readdirSync(rDir).forEach(file => {
        let filePath = path.join(rDir, file);
        if (fs.statSync(filePath).isDirectory()) return;
        let content = fs.readFileSync(filePath, 'utf-8');
        let original = content;
        
        content = content.replace(/require\(['"]\.\.\/models\/([\w]+)['"]\)/g, "require('../$1')");
        
        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log('Fixed', file);
        }
    });
}
