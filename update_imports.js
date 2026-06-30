const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'backend', 'controllers');
const modelsDir = path.join(__dirname, 'backend', 'models');
const routesDir = path.join(__dirname, 'backend', 'routes');

const models = ['User', 'Course', 'Video', 'Enrollment', 'QuizResult', 'Review', 'Certificate', 'UserProgress', 'UserVideoProgress', 'BlockedDevice', 'RefreshToken', 'AdminEmail'];

// تحديث المتحكمات
fs.readdirSync(controllersDir).forEach(file => {
    let filePath = path.join(controllersDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    models.forEach(model => {
        content = content.replace(new RegExp(`require\\(['"]\\.\\./${model}['"]\\)`, 'g'), `require('../models/${model}')`);
        content = content.replace(new RegExp(`require\\(['"]\\.\\./${model}\\.js['"]\\)`, 'g'), `require('../models/${model}.js')`);
    });
    
    content = content.replace(/require\(['"]\.\.\/db['"]\)/g, "require('./db')");
    
    fs.writeFileSync(filePath, content);
});

// تحديث النماذج
fs.readdirSync(modelsDir).forEach(file => {
    let filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    content = content.replace(/require\(['"]\.\.\/db['"]\)/g, "require('./db')");
    content = content.replace(/require\(['"]\.\/db['"]\)/g, "require('./db')");
    
    // الروابط قد تظل تستخدم ('./Video')، وهذا صحيح الآن لأنها في نفس المجلد.
    // إذاً (`./[Model]`) صحيحة للنماذج التي تستدعي بعضها البعض.
    
    fs.writeFileSync(filePath, content);
});

// تحديث المسارات
fs.readdirSync(routesDir).forEach(file => {
    let filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // مسار المصادقة يستخدم الحماية. تم التعديل إلى المجلد الجديد.
    content = content.replace(/require\(['"]\.\.\/middlewares\//g, "require('../middleware/");
    
    fs.writeFileSync(filePath, content);
});

console.log('Imports updated');
