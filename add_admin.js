require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./db');
const User = require('./User');

async function forceAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const email = 'ms9949057@gmail.com';
        const password = 'admi';
        const hashedPassword = await bcrypt.hash(password, 10);

        let user = await User.unscoped().findOne({ where: { email } });

        if (user) {
            console.log('User found. Updating role to admin and resetting password...');
            await user.update({
                role: 'admin',
                password: hashedPassword,
                isVerified: true
            }, { hooks: false });
            console.log('✅ Admin updated successfully.');
        } else {
            console.log('User not found. Creating admin...');
            await User.create({
                name: 'mohab fahd',
                email: email,
                phone: '01000000001',
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                bio: 'Platform Administrator & Lead Developer'
            }, { hooks: false });
            console.log('✅ Admin created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error forcing admin:', error);
        process.exit(1);
    }
}

forceAdmin();
