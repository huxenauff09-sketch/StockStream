// ===== API MODULE =====
// This module handles all API communication with the backend

// API Configuration
const API_BASE = 'http://localhost:3000/users';

// ===== CHECK IF BACKEND IS RUNNING =====
async function checkBackendConnection() {
    try {
        const response = await fetch(API_BASE + '/display', { method: 'GET' });
        console.log('✓ Backend is running on port 3000');
        return true;
    } catch (error) {
        console.error('✗ Backend is NOT running or not reachable!');
        console.error('Error:', error.message);
        alert('WARNING: Cannot connect to backend at http://localhost:3000\n\nMake sure the Node.js backend is running with: npm run start:dev');
        return false;
    }
}

// ===== LOGIN HANDLER =====
async function submitLogin(emailInput, passwordInput, messageDiv) {
    // Validation
    if (!emailInput.value.trim()) {
        messageDiv.textContent = '❌ Please enter email';
        messageDiv.className = 'message error';
        return;
    }
    
    if (!isValidEmail(emailInput.value.trim())) {
        messageDiv.textContent = '❌ Please enter a valid email';
        messageDiv.className = 'message error';
        return;
    }
    
    if (!passwordInput.value.trim()) {
        messageDiv.textContent = '❌ Please enter password';
        messageDiv.className = 'message error';
        return;
    }
    
    try {
        const payload = {
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
        };
        
        console.log('Attempting login:', payload.email);
        
        const res = await fetch(API_BASE + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            console.error('Login failed:', errorData);
            throw new Error(errorData.message || 'Login failed');
        }
        
        const data = await res.json();
        console.log('✓ Login successful:', data);
        
        // Store user data in localStorage
        localStorage.setItem('userData', JSON.stringify({
            id: data.id,
            email: data.email
        }));
        
        messageDiv.textContent = `✓ ${data.message}`;
        messageDiv.className = 'message success';
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
            window.location.href = 'StockStreamDB/StockStream.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        messageDiv.textContent = `❌ ${error.message}`;
        messageDiv.className = 'message error';
    }
}

// ===== REGISTER HANDLER =====
async function submitRegister(emailInput, passwordInput, password2Input, messageDiv, nameInput = null, usernameInput = null) {
    // Validation
    if (!emailInput.value.trim()) {
        messageDiv.textContent = '❌ Please enter email';
        messageDiv.className = 'message error';
        return;
    }
    
    if (!isValidEmail(emailInput.value.trim())) {
        messageDiv.textContent = '❌ Please enter a valid email';
        messageDiv.className = 'message error';
        return;
    }
    
    if (!passwordInput.value.trim()) {
        messageDiv.textContent = '❌ Please enter password';
        messageDiv.className = 'message error';
        return;
    }
    
    if (passwordInput.value !== password2Input.value) {
        messageDiv.textContent = '❌ Passwords do not match';
        messageDiv.className = 'message error';
        return;
    }

    // Validate name if provided (max 30 characters)
    if (nameInput && nameInput.value.trim()) {
        if (nameInput.value.trim().length > 30) {
            messageDiv.textContent = '❌ Full name must be 30 characters or less';
            messageDiv.className = 'message error';
            return;
        }
    }

    // Validate username if provided
    if (usernameInput && usernameInput.value.trim()) {
        const username = usernameInput.value.trim();
        if (username.length > 10) {
            messageDiv.textContent = '❌ Username must be 10 characters or less';
            messageDiv.className = 'message error';
            return;
        }
        if (username.includes(' ')) {
            messageDiv.textContent = '❌ Username cannot contain spaces';
            messageDiv.className = 'message error';
            return;
        }
    }
    
    try {
        const payload = {
            email: emailInput.value.trim(),
            password: passwordInput.value.trim(),
            name: nameInput ? nameInput.value.trim() : undefined,
            username: usernameInput ? usernameInput.value.trim() : undefined
        };
        
        console.log('Attempting registration:', payload.email);
        
        const res = await fetch(API_BASE + '/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            console.error('Registration failed:', errorData);
            throw new Error(errorData.message || 'Registration failed');
        }
        
        const data = await res.json();
        console.log('✓ Registration successful:', data);
        
        messageDiv.textContent = `✓ Registration successful! ID: ${data.id}`;
        messageDiv.className = 'message success';
        
        emailInput.value = '';
        passwordInput.value = '';
        password2Input.value = '';
        
        setTimeout(() => {
            messageDiv.textContent = '';
        }, 2000);
        
        // Refresh users list
        await loadUsers();
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        messageDiv.textContent = `❌ ${error.message}`;
        messageDiv.className = 'message error';
    }
}

// ===== LOAD AND DISPLAY USERS =====
function loadUsers() {
    return new Promise((resolve, reject) => {
        fetch(API_BASE + '/display')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(users => {
                const tableBody = document.getElementById('tableBody');
                if (!tableBody) {
                    reject(new Error('Table body not found'));
                    return;
                }
                
                if (users.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No users registered yet</td></tr>';
                    resolve();
                    return;
                }
                
                tableBody.innerHTML = users.map(user => `
                    <tr id="row-${user.id}">
                        <td>${user.id}</td>
                        <td>${user.email}</td>
                        <td>
                            <button class="btn-delete" data-id="${user.id}">Delete</button>
                        </td>
                    </tr>
                `).join('');
                
                console.log('✓ Loaded', users.length, 'users');
                resolve();
            })
            .catch(error => {
                console.error('❌ Error loading users:', error);
                reject(error);
            });
    });
}

// ===== EMAIL VALIDATION =====
function isValidEmail(email) {
    // Simple validation: just check if @ exists
    return email.includes('@');
}

// ===== DELETE USER =====
async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(API_BASE + `/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Delete failed');
        
        const rowElement = document.getElementById(`row-${id}`);
        if (rowElement) {
            rowElement.remove();
        }
        console.log('✓ User deleted');
        alert('✓ User deleted successfully!');
        
        await loadUsers();
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        alert('❌ Failed to delete user: ' + error.message);
    }
}

// ===== GET SINGLE USER =====
async function getUser(id) {
    const res = await fetch(API_BASE + `/${id}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
}

// ===== PROFILE HELPERS =====
function getUserData() {
    try {
        const raw = localStorage.getItem('userData');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

async function updateProfile(userId, payload) {
    const res = await fetch(API_BASE + `/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Update failed');
    }
    return res.json();
}

// ===== TASK API FUNCTIONS =====
const TASK_API_BASE = 'http://localhost:3000/tasks';

// Create new task
async function createTask(taskData) {
    const res = await fetch(TASK_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create task');
    }
    return res.json();
}

// Get all tasks
async function getAllTasks() {
    const res = await fetch(TASK_API_BASE);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
}

// Get tasks by user ID
async function getUserTasks(userId) {
    const res = await fetch(`${TASK_API_BASE}/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user tasks');
    return res.json();
}

// Get single task
async function getTask(taskId) {
    const res = await fetch(`${TASK_API_BASE}/${taskId}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
}

// Update task
async function updateTask(taskId, taskData) {
    const res = await fetch(`${TASK_API_BASE}/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update task');
    }
    return res.json();
}

// Delete task
async function deleteTask(taskId) {
    const res = await fetch(`${TASK_API_BASE}/${taskId}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
}
