const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'backend', 'controllers');
const modelsDir = path.join(__dirname, 'backend', 'models');
const routesDir = path.join(__dirname, 'backend', 'routes');

const models = ['User', 'Course', 'Video', 'Enrollment', 'QuizResult', 'Review', 'Certificate', 'UserProgress', 'UserVideoProgress', 'BlockedDevice', 'RefreshToken', 'AdminEmail'];

// Update Controllers
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

// Update Models
fs.readdirSync(modelsDir).forEach(file => {
    let filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    content = content.replace(/require\(['"]\.\.\/db['"]\)/g, "require('./db')");
    content = content.replace(/require\(['"]\.\/db['"]\)/g, "require('./db')");
    
    // Associations might still be doing `require('./Video')`, they should now do `require('./Video')` since they are in the same folder.
    // So `require('./[Model]')` is fine for models requiring each other.
    
    fs.writeFileSync(filePath, content);
});

// Update Routes
fs.readdirSync(routesDir).forEach(file => {
    let filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Auth route uses protect middleware. If it was `../middlewares/authMiddleware`, now it's `../middleware/authMiddleware`
    content = content.replace(/require\(['"]\.\.\/middlewares\//g, "require('../middleware/");
    
    fs.writeFileSync(filePath, content);
});

console.log('Imports updated');
