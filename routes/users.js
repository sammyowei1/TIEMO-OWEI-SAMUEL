const express = require('express');
const router = express.Router();
const { Redis } = require('@upstash/redis');
const bcrypt = require('bcrypt');

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Test Redis connection
async function testRedisConnection() {
    try {
        console.log('Testing Redis connection...');
        console.log('Redis URL:', process.env.UPSTASH_REDIS_REST_URL);
        const testKey = 'test:connection';
        await redis.set(testKey, 'test');
        const value = await redis.get(testKey);
        await redis.del(testKey);
        console.log('Redis connection test successful');
        return true;
    } catch (error) {
        console.error('Redis connection test failed:', error);
        return false;
    }
}

// Get all users
router.get('/', async (req, res) => {
    try {
        // Test Redis connection first
        const isConnected = await testRedisConnection();
        if (!isConnected) {
            throw new Error('Redis connection failed');
        }

        console.log('Fetching all users...');
        // Get all user keys
        const keys = await redis.keys('user:*');
        console.log('Found keys:', keys);
        
        if (!keys || keys.length === 0) {
            console.log('No users found in the database');
            return res.json([]);
        }

        // Get all users
        const users = await Promise.all(
            keys.map(async (key) => {
                try {
                    const user = await redis.get(key);
                    if (!user) {
                        console.log(`No data found for key: ${key}`);
                        return null;
                    }
                    // Check if user is already an object
                    if (typeof user === 'object') {
                        return user;
                    }
                    // If it's a string, try to parse it
                    return JSON.parse(user);
                } catch (error) {
                    console.error(`Error processing user data for key ${key}:`, error);
                    return null;
                }
            })
        );

        // Filter out any null values
        const validUsers = users.filter(user => user !== null);
        console.log('Users fetched successfully:', validUsers);
        
        res.json(validUsers);
    } catch (error) {
        console.error('Error in GET /users:', error);
        res.status(500).json({ 
            error: 'Failed to fetch users',
            details: error.message
        });
    }
});

// Register new user
router.post('/', async (req, res) => {
    try {
        const userData = req.body;
        console.log('Registering new user:', userData);

        // Validate required fields
        if (!userData.matricNumber || !userData.fullName || !userData.department || !userData.level || !userData.password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await redis.get(`user:${userData.matricNumber}`);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);
        
        // Create user object with hashed password
        const userToStore = {
            matricNumber: userData.matricNumber,
            fullName: userData.fullName,
            department: userData.department,
            level: userData.level,
            session: userData.session,
            passwordHash: passwordHash,
            clearanceStatus: userData.clearanceStatus || 'pending'
        };

        // Store user in Redis
        const key = `user:${userData.matricNumber}`;
        await redis.set(key, JSON.stringify(userToStore));

        // Verify the user was stored
        const storedUser = await redis.get(key);
        if (!storedUser) {
            throw new Error('Failed to verify user creation');
        }

        // Parse the stored user to return
        const parsedUser = JSON.parse(storedUser);
        // Remove password hash from response
        const { passwordHash: _, ...userResponse } = parsedUser;

        console.log('User registered successfully:', userResponse);
        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ 
            error: 'Failed to register user',
            details: error.message
        });
    }
});

// Update user
router.put('/:matricNumber', async (req, res) => {
    try {
        const { matricNumber } = req.params;
        const userData = req.body;
        console.log('Updating user:', matricNumber, userData);

        // Validate required fields
        if (!userData.matricNumber || !userData.fullName || !userData.department || !userData.level) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user exists
        const existingUser = await redis.get(`user:${matricNumber}`);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user in Redis
        const key = `user:${matricNumber}`;
        await redis.set(key, userData); // Store as object directly

        // Verify the update
        const updatedUser = await redis.get(key);
        if (!updatedUser) {
            throw new Error('Failed to verify user update');
        }

        console.log('User updated successfully:', updatedUser);
        res.json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            error: 'Failed to update user',
            details: error.message
        });
    }
});

module.exports = router; 