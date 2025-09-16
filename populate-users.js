// populate-users.js - Script to populate Redis with test users
const bcrypt = require('bcrypt');
require('dotenv').config();

async function populateUsers() {
    try {
        console.log('Starting user population...');
        
        // Sample users to add to database
        const users = [
            {
                id: 1,
                matricNumber: "CSC/2020/001",
                fullName: "John Doe",
                department: "Computer Science",
                level: 400,
                session: "2024/2025",
                passwordHash: await bcrypt.hash("password123", 10)
            },
            {
                id: 2,
                matricNumber: "ENG/2021/042",
                fullName: "Tiemo Samuel",
                department: "Engineering",
                level: 300,
                session: "2024/2025",
                passwordHash: await bcrypt.hash("securepass", 10)
            },
            {
                id: 3,
                matricNumber: "FSC/CSC/21002835",
                fullName: "Tiemo Samuel",
                department: "Computer Science",
                level: 300,
                session: "2024/2025",
                passwordHash: await bcrypt.hash("shazam123", 10)
            },

            {
                id: 7,
                matricNumber: "FSC/CSC/21002838",
                fullName: "Funsho Gbenga",
                department: "Computer Science",
                level: 400,
                session: "2024/2025",
                passwordHash: await bcrypt.hash("funsho123", 10)
            }
        ];

        
        // Add users using Upstash REST API
        for (const user of users) {
            const key = `user:${user.matricNumber}`;
            const value = JSON.stringify(user);
            
            console.log(`\nProcessing user: ${user.matricNumber}`);
            console.log('User data to store:', value);
            
            // First, try to get the current value to verify the key
            const getResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
                }
            });
            
            const currentValue = await getResponse.text();
            console.log(`Current value for ${key}:`, currentValue);
            
            // Then set the new value
            const setResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: value
            });
            
            if (!setResponse.ok) {
                const errorText = await setResponse.text();
                console.error(`Failed to add user ${user.matricNumber}:`, errorText);
                throw new Error(`Failed to add user ${user.matricNumber}: ${errorText}`);
            }
            
            console.log(`Added user: ${user.matricNumber}`);
            
            // Verify the stored data
            const verifyResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
                }
            });
            
            const storedData = await verifyResponse.text();
            console.log(`Verification for ${key}:`, storedData);
            
            // For the third user, do additional verification
            if (user.matricNumber === "FSC/CSC/21002835") {
                console.log('\nAdditional verification for third user:');
                console.log('Stored data type:', typeof storedData);
                console.log('Stored data length:', storedData.length);
                try {
                    const parsedData = JSON.parse(storedData);
                    console.log('Parsed data:', parsedData);
                    console.log('Password hash exists:', !!parsedData.passwordHash);
                } catch (e) {
                    console.error('Error parsing stored data:', e);
                }
            }
        }
        
        // List all keys
        const keysResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/keys/*`, {
            headers: {
                'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
            }
        });
        
        const allKeys = await keysResponse.text();
        console.log('All keys in Redis:', allKeys);
        
        console.log('Database population complete');
    } catch (err) {
        console.error('Error populating database:', err);
        process.exit(1);
    }
}

populateUsers();