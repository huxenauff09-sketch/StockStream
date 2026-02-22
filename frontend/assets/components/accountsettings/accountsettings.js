/**
 * Account Settings Page Handler
 */

// Modal Navigation Functions
function showModal(modalId) {
    const modals = document.querySelectorAll('.modal-content');
    modals.forEach(modal => modal.classList.remove('active'));
    
    const targetModal = document.getElementById(modalId);
    if (targetModal) {
        targetModal.classList.add('active');
    }
}

// Initialize Event Listeners
function initializeAccountSettings() {
    // Modal 1: Main Options
    const changeNameBtn = document.getElementById('changeNameBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

    // Modal 2: Change Name & Username
    const backFromNameBtn = document.getElementById('backFromNameBtn');
    const nameForm = document.getElementById('nameForm');
    const nameInput = document.getElementById('nameInput');
    const usernameInput = document.getElementById('usernameInput');

    // Modal 3: Change Password
    const backFromPasswordBtn = document.getElementById('backFromPasswordBtn');
    const passwordForm = document.getElementById('passwordForm');

    // Modal 4: Delete Account
    const backFromDeleteBtn = document.getElementById('backFromDeleteBtn');
    const deleteAccountForm = document.getElementById('deleteAccountForm');

    // Modal 1 Navigation
    if (changeNameBtn) {
        changeNameBtn.addEventListener('click', () => {
            loadCurrentUserData();
            showModal('modal-2');
        });
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            showModal('modal-3');
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            showModal('modal-4');
        });
    }

    // Modal 2 Navigation
    if (backFromNameBtn) {
        backFromNameBtn.addEventListener('click', () => {
            showModal('modal-1');
            nameForm.reset();
            document.getElementById('nameMessage').classList.remove('show');
        });
    }

    // Modal 3 Navigation
    if (backFromPasswordBtn) {
        backFromPasswordBtn.addEventListener('click', () => {
            showModal('modal-1');
            passwordForm.reset();
            document.getElementById('passwordMessage').classList.remove('show');
        });
    }

    // Modal 4 Navigation
    if (backFromDeleteBtn) {
        backFromDeleteBtn.addEventListener('click', () => {
            showModal('modal-1');
            deleteAccountForm.reset();
            document.getElementById('deleteMessage').classList.remove('show');
        });
    }

    // Modal 2: Form Submission
    if (nameForm) {
        nameForm.addEventListener('submit', handleNameFormSubmit);

        // Character counters
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                document.getElementById('nameCount').textContent = nameInput.value.length;
            });
        }

        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                document.getElementById('usernameCount').textContent = usernameInput.value.length;
            });
        }
    }

    // Modal 3: Form Submission
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordFormSubmit);
    }

    // Modal 4: Delete Account Form Submission
    if (deleteAccountForm) {
        deleteAccountForm.addEventListener('submit', handleDeleteAccountSubmit);
    }

    // Password visibility toggle
    setupPasswordToggles();
}

// Load current user data into the name form
function loadCurrentUserData() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const nameInput = document.getElementById('nameInput');
    const usernameInput = document.getElementById('usernameInput');

    if (nameInput && userData.name) {
        nameInput.value = userData.name;
        document.getElementById('nameCount').textContent = userData.name.length;
    }

    if (usernameInput && userData.username) {
        usernameInput.value = userData.username;
        document.getElementById('usernameCount').textContent = userData.username.length;
    }
}

// Handle Name Form Submission
async function handleNameFormSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('nameInput');
    const usernameInput = document.getElementById('usernameInput');
    const messageDiv = document.getElementById('nameMessage');
    const submitBtn = e.target.querySelector('[type="submit"]');

    const name = nameInput.value.trim();
    const username = usernameInput.value.trim();

    // Validation
    if (!name) {
        showMessage(messageDiv, '❌ Please enter a name', 'error');
        return;
    }

    if (name.length > 30) {
        showMessage(messageDiv, '❌ Name must be 30 characters or less', 'error');
        return;
    }

    if (username && username.length > 10) {
        showMessage(messageDiv, '❌ Username must be 10 characters or less', 'error');
        return;
    }

    if (username && username.includes(' ')) {
        showMessage(messageDiv, '❌ Username cannot contain spaces', 'error');
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    showMessage(messageDiv, '⏳ Updating...', 'loading');

    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');

        // Try backend update first
        const payload = {
            name: name,
            username: username || undefined
        };

        const response = await fetch(`http://localhost:3000/users/${userData.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        const updatedUser = await response.json();

        // Update localStorage
        userData.name = name;
        if (username) userData.username = username;
        localStorage.setItem('userData', JSON.stringify(userData));

        showMessage(messageDiv, '✓ Profile updated successfully', 'success');

        setTimeout(() => {
            showModal('modal-1');
            document.getElementById('nameForm').reset();
            messageDiv.classList.remove('show');
        }, 1500);

    } catch (error) {
        console.error('Error updating profile:', error);

        // Fallback to localStorage only
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.name = name;
        if (username) userData.username = username;
        localStorage.setItem('userData', JSON.stringify(userData));

        showMessage(messageDiv, '✓ Profile updated (local)', 'success');

        setTimeout(() => {
            showModal('modal-1');
            document.getElementById('nameForm').reset();
            messageDiv.classList.remove('show');
        }, 1500);
    } finally {
        submitBtn.disabled = false;
    }
}

// Handle Password Form Submission
async function handlePasswordFormSubmit(e) {
    e.preventDefault();

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('passwordMessage');
    const submitBtn = e.target.querySelector('[type="submit"]');

    // Validation
    if (!oldPassword) {
        showMessage(messageDiv, '❌ Please enter your current password', 'error');
        return;
    }

    if (!newPassword || newPassword.length < 8) {
        showMessage(messageDiv, '❌ New password must be at least 8 characters', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage(messageDiv, '❌ Passwords do not match', 'error');
        return;
    }

    if (oldPassword === newPassword) {
        showMessage(messageDiv, '❌ New password must be different from current password', 'error');
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    showMessage(messageDiv, '⏳ Changing password...', 'loading');

    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');

        // Try backend update first
        const payload = {
            oldPassword: oldPassword,
            newPassword: newPassword
        };

        const response = await fetch(`http://localhost:3000/users/${userData.id}/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to change password');
        }

        showMessage(messageDiv, '✓ Password changed successfully', 'success');

        setTimeout(() => {
            showModal('modal-1');
            document.getElementById('passwordForm').reset();
            messageDiv.classList.remove('show');
        }, 1500);

    } catch (error) {
        console.error('Error changing password:', error);
        showMessage(messageDiv, `❌ ${error.message || 'Failed to change password'}`, 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

// Handle Delete Account Submission
async function handleDeleteAccountSubmit(e) {
    e.preventDefault();

    const deletePassword = document.getElementById('deletePassword').value;
    const messageDiv = document.getElementById('deleteMessage');
    const submitBtn = e.target.querySelector('[type="submit"]');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    // Validation
    if (!deletePassword) {
        showMessage(messageDiv, '❌ Please enter your password to confirm', 'error');
        return;
    }

    // Confirm deletion
    if (!confirm('Are you absolutely sure you want to delete your account? This cannot be undone!')) {
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    showMessage(messageDiv, '⏳ Deleting account...', 'loading');

    try {
        // Try to delete from backend first
        const response = await fetch(`http://localhost:3000/users/${userData.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: deletePassword })
        });

        // Even if backend fails, continue with local cleanup
        console.log('Backend delete response:', response.status);

    } catch (error) {
        console.error('Backend delete error (continuing with local cleanup):', error);
    }

    // Clean up local data
    try {
        // 1. Remove tasks created by this user from backend/localStorage
        const allTasks = JSON.parse(localStorage.getItem('allTasks') || '[]');
        const filteredTasks = allTasks.filter(t => t.author !== userData.email && t.author !== userData.username);
        localStorage.setItem('allTasks', JSON.stringify(filteredTasks));

        // 2. Remove completed tasks by this user
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
        const filteredCompleted = completedTasks.filter(t => t.completedBy !== userData.email && t.completedBy !== userData.username);
        localStorage.setItem('completedTasks', JSON.stringify(filteredCompleted));

        // 3. Remove user's claimed tasks
        const userTasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
        localStorage.setItem('userTasks', JSON.stringify([]));

        // 4. Remove friend requests (both sent and received)
        const friendRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
        const filteredRequests = friendRequests.filter(r => r.fromId !== userData.id && r.toId !== userData.id);
        localStorage.setItem('friendRequests', JSON.stringify(filteredRequests));

        // 5. Remove friends
        const friends = JSON.parse(localStorage.getItem('friends') || '[]');
        const filteredFriends = friends.filter(f => f.userId1 !== userData.id && f.userId2 !== userData.id);
        localStorage.setItem('friends', JSON.stringify(filteredFriends));

        // 6. Clear user data and logout
        localStorage.removeItem('userData');
        localStorage.removeItem('token');

        showMessage(messageDiv, '✓ Account deleted successfully!', 'success');

        // Redirect to login after a short delay
        setTimeout(() => {
            window.location.href = '../../login/login.html';
        }, 1500);

    } catch (error) {
        console.error('Error during local cleanup:', error);
        // Still logout even if there's an error
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        window.location.href = '../../login/login.html';
    }
}

// Show Message Helper
function showMessage(messageDiv, text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message-box show ${type}`;
}

// Setup Password Visibility Toggle
function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password-btn');

    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = button.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);

            if (targetInput) {
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    button.textContent = '🙈';
                } else {
                    targetInput.type = 'password';
                    button.textContent = '👁️';
                }
            }
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAccountSettings);

