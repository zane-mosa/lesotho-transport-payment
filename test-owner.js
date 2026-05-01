// test-owner.js
const { sequelize } = require('./src/config/database');
const { Vehicle, User } = require('./src/models');

async function test() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');
        
        const ownerId = 1;
        const vehicles = await Vehicle.findAll({
            where: { owner_id: ownerId },
            include: [{
                model: User,
                as: 'driver',
                attributes: ['user_id', 'name', 'phone_number']
            }]
        });
        
        console.log('Vehicles found:', vehicles.length);
        vehicles.forEach(v => {
            console.log(`  - ${v.taxi_number} | Driver: ${v.driver?.name || 'No driver'}`);
        });
        
        await sequelize.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

test();