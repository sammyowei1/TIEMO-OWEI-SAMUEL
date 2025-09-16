document.getElementById('createUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        matricNumber: document.getElementById('matricNumber').value,
        fullName: document.getElementById('fullName').value,
        department: document.getElementById('department').value,
        level: parseInt(document.getElementById('level').value),
        session: document.getElementById('session').value,
        password: document.getElementById('password').value
    };

    try {
        console.log('Sending request with data:', formData);
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        console.log('Server response:', result);
        
        if (response.ok) {
            showMessage('User created successfully!', 'success');
            document.getElementById('createUserForm').reset();
        } else {
            showMessage(result.error || 'Failed to create user', 'error');
        }
    } catch (error) {
        console.error('Detailed error:', error);
        showMessage(`Error: ${error.message}`, 'error');
    }
});

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
} 