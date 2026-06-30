const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const routesDir = path.join(rootDir, 'routes');

const models = ['User', 'Course', 'Video', 'Enrollment', 'QuizResult', 'Review', 'Certificate', 'UserProgress', 'UserVideoProgress', 'BlockedDevice', 'RefreshToken', 'AdminEmail'];

// إصلاح الملفات في الجذر (المتحكمات والنماذج وسيرفر)
fs.readdirSync(rootDir).forEach(file => {
    if (!file.endsWith('.js')) return;
    let filePath = path.join(rootDir, file);
    if (fs.statSync(filePath).isDirectory()) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    models.forEach(model => {
        content = content.replace(new RegExp(`require\\(['"]\\.\\./models/${model}['"]\\)`, 'g'), `require('../${model}')`);
        // إذا كان الكنترولر في الجذر، يجب أن يستدعي ('./Model') وليس ('../Model')
        // دعنا نصلحها جميعاً بشكل صحيح بناءً على موقعها الحالي
        content = content.replace(new RegExp(`require\\(['"]\\.\\./models/${model}['"]\\)`, 'g'), `require('./${model}')`);
        content = content.replace(new RegExp(`require\\(['"]\\./models/${model}['"]\\)`, 'g'), `require('./${model}')`);
    });
    
    content = content.replace(/require\(['"]\.\.\/config\/db['"]\)/g, "require('./db')");
    content = content.replace(/require\(['"]\.\/config\/db['"]\)/g, "require('./db')");
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
    }
});

// إصلاح المسارات
if (fs.existsSync(routesDir)) {
    fs.readdirSync(routesDir).forEach(file => {
        let filePath = path.join(routesDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        let original = content;
        
        content = content.replace(/require\(['"]\.\.\/middleware\//g, "require('../middlewares/");
        
        // إذا كانت المسارات تستدعي الكنترولرز مثل require('../controllers/X')، ستصبح require('../X')
        content = content.replace(/require\(['"]\.\.\/controllers\//g, "require('../");
        
        if (content !== original) {
            fs.writeFileSync(filePath, content);
        }
    });
}

console.log('Backend imports reverted.');
