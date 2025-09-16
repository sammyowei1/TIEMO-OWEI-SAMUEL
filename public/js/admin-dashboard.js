// admin-dashboard.js - Handles admin dashboard functionality with Redis integration

// Configuration
const API_BASE_URL = 'http://localhost:5000'; // Backend API URL

// DOM Elements
const userList = document.getElementById('userList');
const searchInput = document.getElementById('searchInput');
const departmentFilter = document.getElementById('departmentFilter');
const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
const editUserForm = document.getElementById('editUserForm');
const saveUserChanges = document.getElementById('saveUserChanges');

// Current user being edited
let currentEditUser = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Load all users when the page loads
    loadAllUsers();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Sets up all event listeners for the dashboard
 */
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Department filter
    departmentFilter.addEventListener('change', handleDepartmentFilter);
    
    // Save user changes
    saveUserChanges.addEventListener('click', handleSaveUserChanges);
}

/**
 * Loads all users from Redis and displays them
 */
async function loadAllUsers() {
    try {
        // Show loading state
        userList.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"></div></div>';
        
        // Get all users from the backend
        const response = await fetch(`${API_BASE_URL}/api/users`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        userList.innerHTML = '<div class="col-12 alert alert-danger">Failed to load users</div>';
    }
}

/**
 * Displays users in the dashboard
 * @param {Array} users - Array of user objects
 */
function displayUsers(users) {
    userList.innerHTML = '';
    
    users.forEach(user => {
        const userCard = createUserCard(user);
        userList.appendChild(userCard);
    });
}

/**
 * Creates a user card element
 * @param {Object} user - User object
 * @returns {HTMLElement} - User card element
 */
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 user-card';
    
    card.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">${user.fullName}</h5>
                <p class="card-text">
                    <strong>Matric Number:</strong> ${user.matricNumber}<br>
                    <strong>Department:</strong> ${user.department}<br>
                    <strong>Level:</strong> ${user.level}<br>
                    <strong>Clearance Status:</strong> 
                    <span class="badge bg-${getStatusBadgeColor(user.clearanceStatus)}">
                        ${user.clearanceStatus || 'pending'}
                    </span>
                </p>
                <button class="btn btn-primary btn-sm edit-user" data-user-id="${user.matricNumber}">
                    Edit User
                </button>
            </div>
        </div>
    `;
    
    // Add edit button event listener
    card.querySelector('.edit-user').addEventListener('click', () => openEditModal(user));
    
    return card;
}

/**
 * Opens the edit modal with user data
 * @param {Object} user - User object to edit
 */
function openEditModal(user) {
    currentEditUser = user;
    
    // Fill form with user data
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editMatricNumber').value = user.matricNumber;
    document.getElementById('editFullName').value = user.fullName;
    document.getElementById('editDepartment').value = user.department;
    document.getElementById('editLevel').value = user.level;
    document.getElementById('editClearanceStatus').value = user.clearanceStatus || 'pending';
    
    editUserModal.show();
}

/**
 * Handles saving user changes
 */
async function handleSaveUserChanges() {
    if (!currentEditUser) return;
    
    try {
        // Get updated values from form
        const updatedUser = {
            ...currentEditUser,
            fullName: document.getElementById('editFullName').value,
            department: document.getElementById('editDepartment').value,
            level: parseInt(document.getElementById('editLevel').value),
            clearanceStatus: document.getElementById('editClearanceStatus').value
        };
        
        // Update user through the backend
        const response = await fetch(`${API_BASE_URL}/api/users/${updatedUser.matricNumber}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUser)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update user');
        }
        
        // Close modal and refresh user list
        editUserModal.hide();
        loadAllUsers();
        
        // Show success message
        alert('User updated successfully!');
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user. Please try again.');
    }
}

/**
 * Handles search functionality
 */
async function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const department = departmentFilter.value;
    
    try {
        // Get all users from the backend
        const response = await fetch(`${API_BASE_URL}/api/users`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const users = await response.json();
        
        // Filter users based on search term and department
        const filteredUsers = users.filter(user => {
            const matchesSearch = user.matricNumber.toLowerCase().includes(searchTerm) ||
                                user.fullName.toLowerCase().includes(searchTerm);
            const matchesDepartment = !department || user.department === department;
            return matchesSearch && matchesDepartment;
        });
        
        displayUsers(filteredUsers);
    } catch (error) {
        console.error('Error searching users:', error);
        userList.innerHTML = '<div class="col-12 alert alert-danger">Failed to search users</div>';
    }
}

/**
 * Handles department filter changes
 */
function handleDepartmentFilter() {
    handleSearch();
}

/**
 * Returns the appropriate badge color based on clearance status
 * @param {string} status - Clearance status
 * @returns {string} - Bootstrap badge color class
 */
function getStatusBadgeColor(status) {
    switch (status) {
        case 'completed':
            return 'success';
        case 'in_progress':
            return 'warning';
        case 'pending':
        default:
            return 'secondary';
    }
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 