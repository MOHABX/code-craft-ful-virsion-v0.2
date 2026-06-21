const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false, // To disable logging SQL queries in the console
    }
);

const connectDB = async () => {
    try {
        // Create the database programmatically if it doesn't exist
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        await connection.end();

        await sequelize.authenticate();
        console.log(`✅ MySQL Connected Successfully.`);

        // 🔥 التعديل هنا: إيقاف alterSync لتجنب مشكلة ER_TOO_MANY_KEYS الخاصة بـ Sequelize
        const alterSync = true; // Set to true to alter tables for the new models

        // Require models to ensure they are registered before syncing
        require('./User');
        require('./Course');
        require('./Video');
        require('./Enrollment');
        require('./QuizResult');
        require('./Review');
        require('./Certificate');
        require('./UserProgress');
        require('./UserVideoProgress');
        require('./BlockedDevice');
        require('./RefreshToken');
        require('./AdminEmail');

        await sequelize.sync({ alter: alterSync });
        
        console.log("✅ All models were synchronized successfully.");

    } catch (error) {
        console.error(`❌ Unable to connect to the database:`, error);
    }
}

module.exports = { sequelize, connectDB };