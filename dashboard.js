// dashboard.js - Handles dashboard functionality for the E-Clearance System

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthentication();
    
    // Get DOM elements
    const logoutBtn = document.getElementById('logoutBtn');
    const downloadCertBtn = document.getElementById('downloadCertBtn');
    
    // Populate student information
    populateStudentInfo();
    
    // Fetch and display clearance requirements
    fetchClearanceRequirements();
    
    // Handle logout button click
    logoutBtn.addEventListener('click', function() {
        logout();
    });
    
    // Handle certificate download button click
    downloadCertBtn.addEventListener('click', function() {
        downloadCertificate();
    });
    
    // Function to check if user is authenticated
    function checkAuthentication() {
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
        
        if (!isLoggedIn || !user.matricNumber) {
            // Redirect to login page if not authenticated
            window.location.href = 'index.html';
        }
    }
    
    // Function to populate student information
    function populateStudentInfo() {
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        
        // Set user info in the UI
        document.getElementById('studentName').textContent = user.fullName;
        document.getElementById('fullName').textContent = user.fullName;
        document.getElementById('matricNumber').textContent = user.matricNumber;
        document.getElementById('department').textContent = user.department;
        document.getElementById('level').textContent = user.level;
        document.getElementById('session').textContent = user.session;
        
        // Set student image if available
        const studentImage = document.getElementById('studentImage');
        if (user.profileImage) {
            studentImage.src = user.profileImage;
        } else {
            // Generate a unique avatar based on matric number
            studentImage.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.matricNumber}`;
        }
    }
    
    // Function to fetch clearance requirements
    function fetchClearanceRequirements() {
        // In a real application, this would be an API call to your backend
        // For demo purposes, we'll use mock data
        
        // Simulate fetching data from server
        setTimeout(() => {
            updateClearanceStatus();
        }, 1000);
    }
    
    // Function to update clearance status
    function updateClearanceStatus() {
        // For demo purposes, check how many items are cleared
        const totalRequirements = document.querySelectorAll('#requirementsTable tr').length;
        const clearedRequirements = document.querySelectorAll('#requirementsTable .badge.bg-success').length;
        const pendingRequirements = document.querySelectorAll('#requirementsTable .badge.bg-danger').length;
        
        const overallStatusBadge = document.getElementById('overallStatus');
        
        // Update overall status based on requirements
        if (clearedRequirements === totalRequirements) {
            // All requirements are cleared
            overallStatusBadge.textContent = 'Cleared';
            overallStatusBadge.classList.remove('bg-warning', 'bg-danger');
            overallStatusBadge.classList.add('bg-success');
            
            // Enable certificate download button
            downloadCertBtn.disabled = false;
        } else if (pendingRequirements > 0) {
            // Some requirements are pending
            overallStatusBadge.textContent = 'Pending';
            overallStatusBadge.classList.remove('bg-success', 'bg-warning');
            overallStatusBadge.classList.add('bg-danger');
            
            // Disable certificate download button
            downloadCertBtn.disabled = true;
        } else {
            // In progress
            overallStatusBadge.textContent = 'In Progress';
            overallStatusBadge.classList.remove('bg-success', 'bg-danger');
            overallStatusBadge.classList.add('bg-warning');
            
            // Disable certificate download button
            downloadCertBtn.disabled = true;
        }
    }
    
    // Function to download certificate
    function downloadCertificate() {
        // In a real application, this would call an API to generate a PDF
        alert('Certificate download functionality would be implemented here.\nThis would typically generate a PDF with the student\'s clearance information.');
    }
    
    // Function to handle logout
    function logout() {
        // Clear stored user data
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('isLoggedIn');
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
    
    // Add event listeners for action buttons in requirements table
    document.querySelectorAll('#requirementsTable button').forEach(button => {
        button.addEventListener('click', function(e) {
            const action = e.target.textContent;
            const row = e.target.closest('tr');
            const department = row.cells[0].textContent;
            const requirement = row.cells[1].textContent;
            
            if (action === 'Pay Now') {
                // Simulate payment process
                alert(`Payment process would be initiated here for ${requirement} in ${department}.`);
            } else if (action === 'View Details') {
                // Show details
                alert(`Details for ${requirement} in ${department} would be shown here.`);
            }
        });
    });
});