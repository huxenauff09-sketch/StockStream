/**
 * Login Module - Integrates with old function-based API.js
 */

// ===== FORM TOGGLING =====
function setupFormToggle() {
    const toRegisterLink = document.getElementById('toRegisterLink');
    const toLoginLink = document.getElementById('toLoginLink');
    const loginFormWrapper = document.getElementById('loginFormWrapper');
    const registerFormWrapper = document.getElementById('registerFormWrapper');
    const brandHeader = document.getElementById('brandHeader');

    if (toRegisterLink) {
        toRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormWrapper.classList.remove('active');
            registerFormWrapper.classList.add('active');
            if (brandHeader) {
                brandHeader.classList.add('hidden');
            }
        });
    }

    if (toLoginLink) {
        toLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerFormWrapper.classList.remove('active');
            loginFormWrapper.classList.add('active');
            if (brandHeader) {
                brandHeader.classList.remove('hidden');
            }
        });
    }
}

// ===== PASSWORD TOGGLE =====
function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = button.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);

            if (targetInput) {
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    button.classList.add('active');
                } else {
                    targetInput.type = 'password';
                    button.classList.remove('active');
                }
            }
        });
    });
}

// ===== FORM SUBMISSION HANDLERS =====
function setupFormListeners() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registrationForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            const messageDiv = document.getElementById('loginMessage');

            // Create message div if it doesn't exist
            if (!messageDiv) {
                const div = document.createElement('div');
                div.id = 'loginMessage';
                div.className = 'message-box';
                loginForm.parentElement.appendChild(div);
            }

            submitLogin(emailInput, passwordInput, document.getElementById('loginMessage') || messageDiv);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('registerEmail');
            const passwordInput = document.getElementById('registerPassword');
            const confirmPasswordInput = document.getElementById('registerConfirmPassword');
            const messageDiv = document.getElementById('registerMessage');

            // Create message div if it doesn't exist
            if (!messageDiv) {
                const div = document.createElement('div');
                div.id = 'registerMessage';
                div.className = 'message-box';
                registerForm.parentElement.appendChild(div);
            }

            submitRegister(emailInput, passwordInput, confirmPasswordInput, document.getElementById('registerMessage') || messageDiv);
        });
    }
}

// ===== DASHBOARD REFRESH =====
function setupDashboardRefresh() {
    const refreshBtn = document.querySelector('.dashboard-refresh-btn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            refreshBtn.classList.add('refreshing');
            
            loadUsers().then(() => {
                refreshBtn.classList.remove('refreshing');
                updateTimestamp();
            }).catch((error) => {
                console.error('Error refreshing users:', error);
                refreshBtn.classList.remove('refreshing');
            });
        });
    }
}

// ===== UPDATE TIMESTAMP =====
function updateTimestamp() {
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        lastUpdatedEl.textContent = timeStr;
    }
}

// ===== CHECK IF ALREADY LOGGED IN =====
function checkAuthStatus() {
    const user = localStorage.getItem('userData');
    if (user) {
        console.log('User already logged in. Redirecting to dashboard...');
        window.location.href = '../../dashboards/Dashboard.html';
    }
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page initialized');
    
    // Check if user is already logged in - redirect to dashboard if so
    checkAuthStatus();
    
    // Setup form controls
    setupFormToggle();
    setupPasswordToggles();
    setupFormListeners();
    setupDashboardRefresh();
    
    // Check backend connection and load users
    checkBackendConnection().then(() => {
        loadUsers().then(() => {
            updateTimestamp();
        }).catch((error) => {
            console.error('Error loading users on init:', error);
        });
    });
});
