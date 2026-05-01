// fix-transactions.js
const { sequelize } = require('./src/config/database');
const { Transaction, Vehicle } = require('./src/models');

async function fixTransactions() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');
        
        // Find all transactions with taxi_number TAXI007 and no vehicle_id
        const transactions = await Transaction.findAll({
            where: {
                taxi_number: 'TAXI007',
                vehicle_id: null
            }
        });
        
        console.log(`📋 Found ${transactions.length} transactions missing vehicle_id\n`);
        
        // Find the vehicle
        const vehicle = await Vehicle.findOne({
            where: { taxi_number: 'TAXI007' }
        });
        
        if (!vehicle) {
            console.log('❌ Vehicle TAXI007 not found!');
            await sequelize.close();
            return;
        }
        
        console.log(`🚗 Found vehicle: ID ${vehicle.vehicle_id}, Taxi ${vehicle.taxi_number}\n`);
        
        let fixed = 0;
        
        for (const transaction of transactions) {
            await transaction.update({ vehicle_id: vehicle.vehicle_id });
            console.log(`✅ Fixed: Transaction ${transaction.transaction_id} -> Vehicle ID ${vehicle.vehicle_id}`);
            fixed++;
        }
        
        console.log(`\n🎉 Fixed ${fixed} transactions!`);
        
        // Verify the fix
        const remaining = await Transaction.findAll({
            where: {
                taxi_number: 'TAXI007',
                vehicle_id: null
            }
        });
        
        console.log(`📋 Remaining transactions without vehicle_id: ${remaining.length}`);
        
        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error);
        await sequelize.close();
    }
}

fixTransactions();