// reset-db.js
const { sequelize } = require('./src/config/database');

async function resetDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');
        
        // Drop all tables
        await sequelize.query('DROP TABLE IF EXISTS transactions CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS vehicles CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS users CASCADE;');
        
        console.log('✅ All tables dropped');
        console.log('✅ Database reset complete!');
        console.log('Now restart your server: node server.js');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

resetDatabase();