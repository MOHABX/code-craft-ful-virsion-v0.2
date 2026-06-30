require('dotenv').config();
const { sequelize } = require('./db');

// استدعاء جميع النماذج لتسجيل الروابط قبل المزامنة
require('./User');
require('./Course');
require('./Video');
require('./Enrollment');
require('./Review');
require('./Certificate');
require('./QuizResult');

async function resetDB() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        
        // المزامنة الإجبارية تحذف جميع الجداول وتعيد إنشائها بالترتيب الصحيح
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        await sequelize.sync({ force: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        
        console.log('Database fully reset and recreated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting DB:', error);
        process.exit(1);
    }
}

resetDB();
