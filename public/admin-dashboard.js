// DOM Elements
const searchInput = document.getElementById('searchInput');
const departmentFilter = document.getElementById('departmentFilter');
const usersContainer = document.getElementById('usersContainer');
const editUserModal = document.getElementById('editUserModal');
const editUserForm = document.getElementById('editUserForm');
const addUserForm = document.getElementById('addUserForm');
const addUserModal = document.getElementById('addUserModal');

// Global variables
let allUsers = [];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing dashboard...');
    loadUsers();
    setupEventListeners();
});

// Load all users from the database
async function loadUsers() {
    try {
        console.log('Loading users...');
        const response = await fetch('/api/users');
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || 'Failed to fetch users');
        }
        
        allUsers = await response.json();
        console.log('Users loaded:', allUsers);
        
        if (allUsers.length === 0) {
            showAlert('No users found in the database. Add some users to get started.', 'info');
        }
        
        displayUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert(`Failed to load users: ${error.message}`, 'danger');
    }
}

// Display users in the container
function displayUsers(users) {
    usersContainer.innerHTML = '';
    
    if (users.length === 0) {
        usersContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    No users found. Use the "Add New User" button to create users.
                </div>
            </div>
        `;
        return;
    }
    
    users.forEach(user => {
        const userCard = createUserCard(user);
        usersContainer.appendChild(userCard);
    });
}

// Create a user card element
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    card.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">${user.fullName}</h5>
                <p class="card-text">
                    <strong>Matric Number:</strong> ${user.matricNumber}<br>
                    <strong>Department:</strong> ${user.department}<br>
                    <strong>Level:</strong> ${user.level}<br>
                    <strong>Status:</strong> ${user.clearanceStatus}
                </p>
                <button class="btn btn-primary" onclick="openEditModal('${user.matricNumber}')">
                    Edit User
                </button>
            </div>
        </div>
    `;
    return card;
}

// Open the edit modal with user data
async function openEditModal(matricNumber) {
    const user = allUsers.find(u => u.matricNumber === matricNumber);
    if (!user) {
        showAlert('User not found', 'danger');
        return;
    }

    // Populate form fields
    document.getElementById('editMatricNumber').value = user.matricNumber;
    document.getElementById('editFullName').value = user.fullName;
    document.getElementById('editDepartment').value = user.department;
    document.getElementById('editLevel').value = user.level;
    document.getElementById('editClearanceStatus').value = user.clearanceStatus;

    // Show modal
    const modal = new bootstrap.Modal(editUserModal);
    modal.show();
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredUsers = allUsers.filter(user => 
            user.matricNumber.toLowerCase().includes(searchTerm) ||
            user.fullName.toLowerCase().includes(searchTerm)
        );
        displayUsers(filteredUsers);
    });

    // Department filter
    departmentFilter.addEventListener('change', (e) => {
        const department = e.target.value;
        const filteredUsers = department === 'all' 
            ? allUsers 
            : allUsers.filter(user => user.department === department);
        displayUsers(filteredUsers);
    });

    // Edit form submission
    editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            matricNumber: document.getElementById('editMatricNumber').value,
            fullName: document.getElementById('editFullName').value,
            department: document.getElementById('editDepartment').value,
            level: document.getElementById('editLevel').value,
            clearanceStatus: document.getElementById('editClearanceStatus').value
        };

        try {
            // Show loading state
            const submitButton = editUserForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
            submitButton.disabled = true;

            const response = await fetch(`/api/users/${formData.matricNumber}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Failed to update user');
            }

            showAlert('User updated successfully!', 'success');
            loadUsers(); // Refresh the user list
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(editUserModal);
            modal.hide();
        } catch (error) {
            console.error('Error updating user:', error);
            showAlert(`Failed to update user: ${error.message}`, 'danger');
        } finally {
            // Reset button state
            const submitButton = editUserForm.querySelector('button[type="submit"]');
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    });

    // Add user form submission
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            matricNumber: document.getElementById('newMatricNumber').value,
            fullName: document.getElementById('newFullName').value,
            department: document.getElementById('newDepartment').value,
            level: document.getElementById('newLevel').value,
            clearanceStatus: document.getElementById('newClearanceStatus').value
        };

        try {
            // Show loading state
            const submitButton = addUserForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
            submitButton.disabled = true;

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Failed to add user');
            }

            showAlert('User added successfully!', 'success');
            loadUsers(); // Refresh the user list
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(addUserModal);
            modal.hide();
            addUserForm.reset();
        } catch (error) {
            console.error('Error adding user:', error);
            showAlert(`Failed to add user: ${error.message}`, 'danger');
        } finally {
            // Reset button state
            const submitButton = addUserForm.querySelector('button[type="submit"]');
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    });
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
} 