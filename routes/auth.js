// auth.js - Backend authentication using Redis
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { matricNumber, password } = req.body;
        
        console.log('Login attempt for:', matricNumber);
        
        // Get user from Redis using Upstash REST API
        const getResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/user:${encodeURIComponent(matricNumber)}`, {
            headers: {
                'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
            }
        });
        
        if (!getResponse.ok) {
            console.log('Failed to get user data:', await getResponse.text());
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const responseData = await getResponse.json();
        console.log('Raw response data:', responseData);
        
        if (!responseData || !responseData.result) {
            console.log('No user data found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        let user;
        try {
            // Parse the nested JSON string
            user = JSON.parse(responseData.result);
            console.log('Parsed user data:', user);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return res.status(500).json({ message: 'Server error' });
        }
        
        // Compare password with hashed password stored in Redis
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        console.log('Password match:', passwordMatch);
        
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, matricNumber: user.matricNumber },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        // Return user data and token (excluding password hash)
        const { passwordHash, ...userDataWithoutPassword } = user;
        res.json({
            ...userDataWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Token verification endpoint
router.post('/verify-token', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        
        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Invalid token' });
            }
            
            // Check if user still exists in Redis
            const getResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/user:${encodeURIComponent(decoded.matricNumber)}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
                }
            });
            
            if (!getResponse.ok) {
                return res.status(401).json({ message: 'User not found' });
            }
            
            res.status(200).json({ valid: true });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;