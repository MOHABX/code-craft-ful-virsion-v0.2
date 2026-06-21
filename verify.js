require('dotenv').config();
const db = require('./db');
const User = require('./User');
db.connectDB().then(async () => {
    await User.update({ isVerified: true }, { where: { email: 'doc@test.com' } });
    console.log('verified');
    process.exit(0);
});
