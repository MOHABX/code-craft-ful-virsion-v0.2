require('dotenv').config();
const bcrypt = require('bcryptjs');

// Require models to initialize associations
const User = require('./User');
require('./Course');
require('./Video');
require('./Enrollment');
require('./Review');
require('./Certificate');
require('./QuizResult');
const { connectDB } = require('./db');

async function seed() {
    console.log('🌱 Starting seed process...\n');

    await connectDB();

    // ─── 1. إنشاء حساب الأدمن فقط ──────────────────────────────────────────

    // Admin Account
    const [admin, adminCreated] = await User.findOrCreate({
        where: { email: 'ms9949057@gmail.com' },
        defaults: {
            name: 'mohab fahd',
            email: 'ms9949057@gmail.com',
            phone: '01000000001',
            password: 'admin',
            role: 'admin',
            isVerified: true,
            bio: 'Platform Administrator & Lead Developer',
        }
    });
    
    if (!adminCreated) {
        // تحديث الـ role وisVerified
        await admin.update({ role: 'admin', isVerified: true }, { hooks: false });
    }
    console.log(`✅ Admin account ready: ms9949057@gmail.com / admin`);

    console.log('══════════════════════════════════════════════════════');
    console.log('🎉 Seed completed successfully!\n');
    console.log('📋 Test Accounts:');
    console.log('   🔴 Admin   : ms9949057@gmail.com     / admin');
    console.log('══════════════════════════════════════════════════════');

    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
