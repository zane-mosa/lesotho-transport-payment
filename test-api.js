// test-api.js
// Simple script to test the API endpoints

const API_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('🧪 Testing Lesotho Transport Payment API\n');
    
    try {
        // 1. Test health endpoint
        console.log('1. Testing Health Check...');
        const healthRes = await fetch(`${API_URL}/health`);
        const health = await healthRes.json();
        console.log('   ✅ Health check:', health.status);
        
        // 2. Test database status
        console.log('\n2. Testing Database Status...');
        const dbRes = await fetch(`${API_URL}/api/db-status`);
        const dbStatus = await dbRes.json();
        console.log('   ✅ Database:', dbStatus.database);
        
        // 3. Register a test user
        console.log('\n3. Registering Test User...');
        const registerRes = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Passenger',
                phone_number: '12345678',
                password: 'password123',
                role: 'passenger'
            })
        });
        const register = await registerRes.json();
        if (register.success) {
            console.log('   ✅ User registered:', register.user.name);
            console.log('   🔑 Token:', register.token.substring(0, 50) + '...');
        } else {
            console.log('   ⚠️  User may already exist:', register.message);
        }
        
        // 4. Login
        console.log('\n4. Logging In...');
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone_number: '12345678',
                password: 'password123'
            })
        });
        const login = await loginRes.json();
        if (login.success) {
            console.log('   ✅ Login successful:', login.user.name);
            const token = login.token;
            
            // 5. Initiate payment
            console.log('\n5. Initiating Payment...');
            const paymentRes = await fetch(`${API_URL}/api/payments/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: 15,
                    payment_method: 'mpesa'
                })
            });
            const payment = await paymentRes.json();
            if (payment.success) {
                console.log('   ✅ Payment initiated:', payment.transaction.reference);
                console.log('   💰 Amount: M', payment.transaction.amount);
                console.log('   📊 Status:', payment.transaction.status);
            } else {
                console.log('   ❌ Payment failed:', payment.error);
            }
            
            // 6. Get transaction history
            console.log('\n6. Getting Transaction History...');
            const historyRes = await fetch(`${API_URL}/api/payments/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const history = await historyRes.json();
            if (history.success) {
                console.log('   ✅ Found', history.count, 'transactions');
                history.transactions.forEach(tx => {
                    console.log(`      - ${tx.reference}: M${tx.amount} (${tx.status})`);
                });
            }
            
        } else {
            console.log('   ❌ Login failed:', login.error);
        }
        
        console.log('\n✨ API Test Complete!\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nMake sure the server is running: node server.js\n');
    }
}

testAPI();