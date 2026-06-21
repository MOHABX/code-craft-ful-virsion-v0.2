require('dotenv').config();
const { sequelize } = require('./db');

// Require all models to register associations before syncing
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
        
        // Force sync drops all tables and recreates them in the correct dependency order
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
