// login.js - Handles the login functionality for the E-Clearance System with Redis database validation

// Backend API base URL
const API_BASE_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('login-error');
    
    // Check if there's a stored session
    checkExistingSession();
    
    // Handle login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const matricNumber = document.getElementById('matricNumber').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Validate inputs
        if (!matricNumber || !password) {
            showError('Please enter both matric number and password.');
            return;
        }
        
        // Authenticate user against Redis database
        authenticateUser(matricNumber, password, rememberMe);
    });
    
    // Function to authenticate user
    async function authenticateUser(matricNumber, password, rememberMe) {
        try {
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Logging in...';
            submitBtn.disabled = true;

            console.log('Attempting to connect to:', `${API_BASE_URL}/api/auth/login`);

            // Make API call to backend for authentication
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ matricNumber, password })
            }).catch(error => {
                console.error('Network error:', error);
                throw new Error('Could not connect to the server. Please check if the backend is running.');
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            // Ensure user object has a profileImage
            if (!data.profileImage && data.matricNumber) {
                data.profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.matricNumber}`;
            }

            // Store user data based on rememberMe
            if (rememberMe) {
                localStorage.setItem('user', JSON.stringify(data));
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('authToken', data.token);
            } else {
                sessionStorage.setItem('user', JSON.stringify(data));
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('authToken', data.token);
            }

            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Invalid credentials. Please try again.');
            submitBtn.innerHTML = 'Login';
            submitBtn.disabled = false;
        }
    }
    
    // Function to check if user is already logged in
    function checkExistingSession() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
        const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (isLoggedIn === 'true' && authToken) {
            // Verify token validity with the server
            fetch(`${API_BASE_URL}/api/auth/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = 'dashboard.html';
                } else {
                    // Token invalid, clear storage
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('user');
                    localStorage.removeItem('authToken');
                    sessionStorage.removeItem('isLoggedIn');
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('authToken');
                }
            })
            .catch(error => {
                console.error('Token verification error:', error);
            });
        }
    }
    
    // Function to show error message
    function showError(message) {
        loginError.textContent = message;
        loginError.classList.remove('d-none');
        
        // Hide error after 3 seconds
        setTimeout(() => {
            loginError.classList.add('d-none');
        }, 3000);
    }
});