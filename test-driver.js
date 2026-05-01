// test-driver.js
const API_URL = 'http://localhost:3000';

async function testDriverFeatures() {
    console.log('🚖 Testing Driver Features\n');
    
    try {
        // 1. Register a driver
        console.log('1. Registering Driver...');
        const registerRes = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Driver',
                phone_number: '58889999',
                password: 'driver123',
                role: 'driver'
            })
        });
        const register = await registerRes.json();
        
        let token;
        if (register.success) {
            console.log('   ✅ Driver registered:', register.user.name);
            token = register.token;
        } else if (register.error === 'User already exists') {
            console.log('   ⚠️  Driver already exists, logging in...');
            const loginRes = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_number: '58889999',
                    password: 'driver123'
                })
            });
            const login = await loginRes.json();
            token = login.token;
            console.log('   ✅ Driver logged in');
        }
        
        if (!token) {
            console.log('   ❌ Failed to get token');
            return;
        }
        
        // 2. Register vehicle
        console.log('\n2. Registering Vehicle...');
        const vehicleRes = await fetch(`${API_URL}/api/driver/register-vehicle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                taxi_number: 'TAXI001',
                registration_number: 'ABC123',
                route: 'Maseru - Roma',
                capacity: 15
            })
        });
        const vehicle = await vehicleRes.json();
        if (vehicle.success) {
            console.log('   ✅ Vehicle registered:', vehicle.vehicle.taxi_number);
        } else {
            console.log('   ⚠️  Vehicle registration:', vehicle.message || vehicle.error);
        }
        
        // 3. Get driver dashboard
        console.log('\n3. Getting Driver Dashboard...');
        const dashboardRes = await fetch(`${API_URL}/api/driver/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dashboard = await dashboardRes.json();
        if (dashboard.success) {
            console.log('   ✅ Dashboard loaded');
            console.log('   🚕 Taxi:', dashboard.dashboard.vehicle.taxi_number);
            console.log('   📍 Route:', dashboard.dashboard.vehicle.route);
            console.log('   💰 Today\'s Earnings: M', dashboard.dashboard.stats.today_earnings);
            console.log('   🚗 Today\'s Trips:', dashboard.dashboard.stats.today_trips);
        }
        
        // 4. Generate driver QR code
        console.log('\n4. Generating Driver QR Code...');
        const qrRes = await fetch(`${API_URL}/api/driver/generate-qr`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const qr = await qrRes.json();
        if (qr.success) {
            console.log('   ✅ QR Code generated for taxi:', qr.taxi_number);
            console.log('   🔲 QR Code preview:', qr.qr_code.substring(0, 100) + '...');
        }
        
        // 5. Get daily report
        console.log('\n5. Getting Daily Report...');
        const reportRes = await fetch(`${API_URL}/api/driver/daily-report`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const report = await reportRes.json();
        if (report.success) {
            console.log('   ✅ Daily Report for:', report.report.date);
            console.log('   💰 Total Earnings: M', report.report.total_earnings);
            console.log('   🚗 Total Trips:', report.report.total_trips);
        }
        
        console.log('\n✨ Driver Features Test Complete!\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nMake sure the server is running: node server.js\n');
    }
}

testDriverFeatures();