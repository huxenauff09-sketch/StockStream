// button-functions.js
// Handles UI button interactions for login.html

// Utility function to get element by ID
function getEl(id) {
    return document.getElementById(id);
}

// ===== THEME TOGGLE =====
function initializeTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-mode', theme === 'dark');
    const toggleBtn = getEl('themeToggle');
    if (toggleBtn) {
        toggleBtn.textContent = theme === 'dark' ? '🌙' : '💡';
    }
}

function setupThemeToggle() {
    const toggleBtn = getEl('themeToggle');
    if (!toggleBtn) return;
    toggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        const theme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        toggleBtn.textContent = isDark ? '🌙' : '💡';
    });
}

// ===== FORM TOGGLING =====
function setupFormToggle() {
    const toggleRegister = getEl('toggleRegister');
    const toggleLogin = getEl('toggleLogin');
    const loginForm = getEl('login');
    const registerForm = getEl('register');

    if (toggleRegister) {
        toggleRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
        });
    }

    if (toggleLogin) {
        toggleLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        });
    }
}

// ===== FORM SUBMISSIONS USING BACKEND API =====
function setupFormListeners() {
    const loginForm = getEl('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = getEl('loginEmail');
            const passwordInput = getEl('loginPassword');
            const messageDiv = getEl('loginMessage');
            await submitLogin(emailInput, passwordInput, messageDiv);
        });
    }

    const registerForm = getEl('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameInput = getEl('registerName');
            const usernameInput = getEl('registerUsername');
            const emailInput = getEl('registerEmail');
            const passwordInput = getEl('registerPassword');
            const password2Input = getEl('registerPassword2');
            const messageDiv = getEl('registerMessage');
            await submitRegister(emailInput, passwordInput, password2Input, messageDiv, nameInput, usernameInput);
        });
    }
}

// ===== TABLE LISTENERS =====
function setupTableListeners() {
    document.addEventListener('click', (e) => {
        const t = e.target;
        if (t && t.classList && t.classList.contains('btn-delete')) {
            const id = t.getAttribute('data-id');
            if (id) deleteUser(id);
        }
    });
}

function renderUserEmail() {
    const el = document.getElementById('userDisplay');
    const localUser = getUserData();
    
    if (el && localUser) {
        // We'll try to use local storage name/username if available, otherwise fetch or default
        // Since we can't easily make this async in all contexts, we'll try to load fresh data async
        // but display immediate data first.
        
        updateUserDisplay(el, localUser);

        // Fetch fresh data in background
        getUser(localUser.id).then(freshUser => {
            updateUserDisplay(el, freshUser);
        }).catch(err => console.error('Bg user fetch failed', err));
    }
}

function updateUserDisplay(container, user) {
    container.innerHTML = ''; // Clear
    
    // Name Logic
    const nameEl = document.createElement('div');
    nameEl.style.color = 'var(--text-primary)'; // Darker
    nameEl.style.fontSize = '16px';
    nameEl.style.fontWeight = 'bold';
    
    // Username Logic
    const usernameEl = document.createElement('div');
    usernameEl.style.color = 'var(--text-secondary)'; // Lighter
    usernameEl.style.fontSize = '12px';
    
    if (user.name) {
        nameEl.textContent = user.name;
    } else {
        // Default: user### (001 based on ID)
        const idStr = String(user.id).padStart(3, '0');
        nameEl.textContent = `user${idStr}`;
    }
    
    if (user.username) {
        usernameEl.textContent = user.username;
    } else {
        // If no username, maybe show email or nothing? User requested "username a lighter text color below".
        // If no username set, let's show email or empty.
        usernameEl.textContent = user.email || '';
    }
    
    container.appendChild(nameEl);
    container.appendChild(usernameEl);
}

function setupProfileMenu() {
    // Get elements with null checks
    const circle = document.getElementById('profileCircle');
    const dropdown = document.getElementById('profileDropdown');
    
    if (!circle || !dropdown) {
        console.warn('Profile menu elements not found on this page');
        return;
    }

    // Ensure dropdown starts hidden
    dropdown.style.display = 'none';

    // Toggle dropdown on button click
    circle.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        toggleProfileDropdown();
    });

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (dropdown.style.display === 'block') {
            if (!dropdown.contains(e.target) && !circle.contains(e.target)) {
                dropdown.style.display = 'none';
                circle.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
            circle.setAttribute('aria-expanded', 'false');
        }
    });

    // Setup Profile button
    const openProfile = document.getElementById('openProfilePage');
    if (openProfile) {
        openProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            navigateToProfile();
        });
    }

    // Setup Logout button
    const doLogout = document.getElementById('doLogout');
    if (doLogout) {
        doLogout.addEventListener('click', function(e) {
            e.stopPropagation();
            handleLogout();
        });
    }
}

// Unified toggle function
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const circle = document.getElementById('profileCircle');
    
    if (!dropdown || !circle) return;
    
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
        circle.setAttribute('aria-expanded', 'false');
    } else {
        dropdown.style.display = 'block';
        circle.setAttribute('aria-expanded', 'true');
    }
}

// Navigate to profile function
function navigateToProfile() {
    const pathname = window.location.pathname.replace(/\\/g, '/');
    let path = 'Profiles/profile.html';
    
    if (pathname.includes('/StockStreamDB/')) {
        path = '../Profiles/profile.html';
    } else if (pathname.includes('/Profiles/')) {
        path = './profile.html';
    }
    
    window.location.href = path;
}

// Handle logout function
function handleLogout() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    localStorage.removeItem('userData');
    window.location.href = '../login.html';
}

function setupTopRows() {
    document.querySelectorAll('.top-row-item').forEach(el => {
        el.addEventListener('click', () => {
            console.log('Top row clicked:', el.dataset.row || el.textContent);
        });
    });
}
