// verify-installations.js
console.log('🔍 Verifying Package Installations...\n');

// List all required packages
const packages = [
    { name: 'express', required: true, description: 'Web framework' },
    { name: 'cors', required: true, description: 'CORS middleware' },
    { name: 'dotenv', required: true, description: 'Environment variables' },
    { name: 'jsonwebtoken', required: true, description: 'JWT authentication' },
    { name: 'bcryptjs', required: true, description: 'Password hashing' },
    { name: 'pg', required: true, description: 'PostgreSQL driver' },
    { name: 'sequelize', required: true, description: 'ORM' },
    { name: 'qrcode', required: true, description: 'QR code generation' },
    { name: 'axios', required: true, description: 'HTTP client' },
    { name: 'joi', required: true, description: 'Schema validation' },
    { name: 'express-validator', required: true, description: 'Request validation' },
    { name: 'nodemon', required: false, description: 'Dev auto-restart' },
    { name: 'jest', required: false, description: 'Testing framework' },
    { name: 'supertest', required: false, description: 'API testing' }
];

let allGood = true;

packages.forEach(pkg => {
    try {
        require(pkg.name);
        console.log(`✅ ${pkg.name.padEnd(18)} - ${pkg.description} - INSTALLED`);
    } catch (error) {
        if (pkg.required) {
            console.log(`❌ ${pkg.name.padEnd(18)} - ${pkg.description} - MISSING!`);
            allGood = false;
        } else {
            console.log(`⚠️  ${pkg.name.padEnd(18)} - ${pkg.description} - NOT INSTALLED (optional)`);
        }
    }
});

console.log('\n' + '='.repeat(60));
if (allGood) {
    console.log('🎉 All required packages are installed successfully!');
    console.log('📦 Total dependencies: ' + Object.keys(require('./package.json').dependencies).length);
    console.log('🔧 Dev dependencies: ' + Object.keys(require('./package.json').devDependencies || {}).length);
} else {
    console.log('❌ Some required packages are missing. Please run the installation commands again.');
}
console.log('='.repeat(60));
