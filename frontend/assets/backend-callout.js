// ===== INITIALIZATION ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    // Check Authentication (Protect Dashboard)
    checkAuthProtection();
    
    // Initialize theme from localStorage
    initializeTheme();
    
    // Setup theme toggle
    setupThemeToggle();
    
    // Initialize frontend
    checkBackendConnection();
    setupFormToggle();
    setupFormListeners();
    renderUserEmail();
    setupProfileMenu();
    setupTopRows();
    
    // Only load users table if we are on dashboard
    if (document.getElementById('tableBody')) {
        loadUsers().then(() => {
            setupTableListeners();
        });
    }
});

function checkAuthProtection() {
    const isDashboard = window.location.pathname.includes('dashboard.html');
    const user = localStorage.getItem('userData');
    
    if (isDashboard && !user) {
        console.warn('Unauthorized access attempt. Redirecting to login...');
        window.location.href = 'login.html';
    }
}
