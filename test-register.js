// test-register.js
const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');

async function testRegister() {
    try {
        console.log('🔌 Testing database connection...');
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');
        
        console.log('📝 Creating user directly in database...');
        
        const user = await User.create({
            name: 'chocolate',
            phone_number: '66666666',
            password: '123456',
            role: 'passenger'
        });
        
        console.log('✅ User created successfully!');
        console.log('   User ID:', user.user_id);
        console.log('   Name:', user.name);
        console.log('   Phone:', user.phone_number);
        console.log('   Role:', user.role);
        
        await sequelize.close();
        console.log('\n🎉 Registration works through direct database!');
        console.log('\nNow try registering through the web app at http://localhost:3001');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.errors) {
            console.log('\n📋 Validation Errors:');
            error.errors.forEach(e => {
                console.log(`   - ${e.path}: ${e.message}`);
            });
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            console.log('\n⚠️  User with this phone number already exists!');
            console.log('   Try a different phone number.');
        }
        await sequelize.close();
    }
}

testRegister();