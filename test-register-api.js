// test-register-api.js
const http = require('http');

const data = JSON.stringify({
    name: 'zane',
    phone_number: '58999999',
    password: '12341234',
    role: 'passenger'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('📝 Sending registration request...');
console.log('Data:', data);

const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        console.log('\nStatus Code:', res.statusCode);
        console.log('Response:', responseData);
        
        try {
            const json = JSON.parse(responseData);
            if (json.success) {
                console.log('\n✅ Registration successful!');
                console.log('User ID:', json.user.id);
                console.log('Name:', json.user.name);
                console.log('Phone:', json.user.phone_number);
                console.log('Role:', json.user.role);
                console.log('Token:', json.token.substring(0, 50) + '...');
            } else {
                console.log('\n❌ Registration failed:');
                if (json.errors) {
                    json.errors.forEach(err => console.log('  -', err.msg || err.message));
                } else {
                    console.log('  -', json.error || json.message);
                }
            }
        } catch (e) {
            console.log('\n❌ Invalid response:', responseData);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Make sure backend server is running on port 3000');
});

req.write(data);
req.end();