const fs = require('fs');
const path = require('path');
const rootDir = __dirname;
const models = ['User', 'Course', 'Video', 'Enrollment', 'QuizResult', 'Review', 'Certificate', 'UserProgress', 'UserVideoProgress', 'BlockedDevice', 'RefreshToken', 'AdminEmail'];

fs.readdirSync(rootDir).forEach(file => {
    if (!file.endsWith('.js')) return;
    let filePath = path.join(rootDir, file);
    if (fs.statSync(filePath).isDirectory()) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    models.forEach(model => {
        content = content.replace(new RegExp(`require\\(['"]\\.\\.\\/${model}['"]\\)`, 'g'), `require('./${model}')`);
    });
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed', file);
    }
});
