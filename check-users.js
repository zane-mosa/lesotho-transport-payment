// check-users.js
const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');

async function checkUsers() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');
        
        const users = await User.findAll();
        
        if (users.length === 0) {
            console.log('📭 No users found in database.');
            console.log('Please register a new user.');
        } else {
            console.log(`👥 Found ${users.length} user(s):\n`);
            users.forEach(u => {
                console.log(`   Phone: ${u.phone_number}`);
                console.log(`   Name: ${u.name}`);
                console.log(`   Role: ${u.role}`);
                console.log(`   Password hash: ${u.password.substring(0, 30)}...`);
                console.log('   ---');
            });
        }
        
        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkUsers();