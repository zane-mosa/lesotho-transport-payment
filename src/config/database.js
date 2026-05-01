// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// SSL configuration for Neon
const sslConfig = {
    require: true,
    rejectUnauthorized: false
};

if (process.env.DATABASE_URL) {
    console.log('📡 Using DATABASE_URL for connection');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: sslConfig
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
} else {
    console.log('📡 Using individual DB_ variables for connection');
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: false,
            dialectOptions: {
                ssl: sslConfig
            },
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        }
    );
}

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = { sequelize, testConnection };