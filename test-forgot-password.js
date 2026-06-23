const fetch = require('node-fetch');
const crypto = require('crypto');
const User = require('./User');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

async function testForgotPassword() {
    console.log('=== STARTING FORGOT PASSWORD TEST ===');
    
    // We assume there is a user with this email codecraft210@gmail.com
    const email = 'codecraft210@gmail.com';
    
    const res = await fetch(`${API_BASE}/auth/forgotpassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    
    const data = await res.json();
    console.log('Forgot Password response:', data);

    if (data.success) {
        // Let's get the token from DB directly since we didn't mock the email service properly to read the email
        const user = await User.findOne({ where: { email } });
        console.log('User passwordResetToken hashed in DB:', user.passwordResetToken);
        console.log('User passwordResetExpire in DB:', user.passwordResetExpire);
        
        // Wait, the API returns success but the token is not returned (it's sent to email).
        // For testing, we could have extracted it if it was in response, or we just check the DB to ensure it was set.
        if (user.passwordResetToken && user.passwordResetExpire > Date.now()) {
            console.log('✅ Forgot password token generated and saved in DB.');
        } else {
            console.error('❌ Forgot password token missing or expired in DB.');
        }
    }
}

testForgotPassword().then(() => {
    console.log('Test finished.');
    process.exit(0);
}).catch(err => {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
});
