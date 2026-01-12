const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
    try {
        // Login to get token
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@example.com', // Assuming this user exists or I need to create one
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Got token');

        // Create dummy image file
        fs.writeFileSync('test.png', 'fake image content');

        // Upload
        const form = new FormData();
        form.append('favicon', fs.createReadStream('test.png'));

        const res = await axios.post('http://localhost:5000/api/upload/favicon', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Success:', res.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testUpload();
