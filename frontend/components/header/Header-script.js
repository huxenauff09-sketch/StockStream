// Header-script.js
// Handles Header and Top Navigation functionality

// ===== PROFILE DROPDOWN TOGGLE =====
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const circle = document.getElementById('profileCircle');
    
    if (!dropdown || !circle) {
        console.error('Profile dropdown elements not found');
        return;
    }
    
    // Toggle the active class
    dropdown.classList.toggle('active');
    circle.setAttribute('aria-expanded', dropdown.classList.contains('active'));
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profileDropdown');
    const circle = document.getElementById('profileCircle');
    
    if (dropdown && circle && !circle.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
        circle.setAttribute('aria-expanded', 'false');
    }
});

// ===== SETUP DASHBOARD NAVIGATION =====
function setupDashboardNavigation() {
    // StockStream button
    const stockstreamNavBtn = document.getElementById('stockstreamNavBtn');
    if (stockstreamNavBtn) {
        stockstreamNavBtn.addEventListener('click', () => {
            window.location.href = './StockStream.html';
        });
    }
    
    // Dashboards button
    const dashboardsTab = document.querySelector('.top-row-item[data-row="dashboards"]');
    if (dashboardsTab) {
        dashboardsTab.addEventListener('click', () => {
            window.location.href = './Dashboard.html';
        });
    }
    
    // Your Tasks button - Redirects to YourTask.html
    const yourTasksBtn = document.querySelector('.top-row-item[data-row="your tasks"]');
    if (yourTasksBtn) {
        yourTasksBtn.addEventListener('click', () => {
            window.location.href = './YourTask.html';
        });
    }
    
    // Credits button - Navigate to Credentials.html
    const creditsBtn = document.querySelector('.top-row-item[data-row="credits"]');
    if (creditsBtn) {
        creditsBtn.addEventListener('click', () => {
            window.location.href = './Credentials.html';
        });
    }
    
    // View Others button - Navigate to ViewOthers.html
    const viewOthersBtn = document.querySelector('.top-row-item[data-row="view others"]');
    if (viewOthersBtn) {
        viewOthersBtn.addEventListener('click', () => {
            window.location.href = './ViewOthers.html';
        });
    }
    
    // View Profile button - Navigate to ViewProfile.html
    const viewProfileBtn = document.querySelector('.top-row-item[data-row="view profile"]');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', () => {
            window.location.href = './ViewProfile.html';
        });
    }
}

// ===== MARK ACTIVE TAB =====
function markActiveTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.top-row-item').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to current tab
    const currentTab = document.querySelector(`.top-row-item[data-row="${tabName}"]`);
    if (currentTab) {
        currentTab.classList.add('active');
    }
}

// ===== FRIEND REQUEST SYSTEM (Global functions) =====
function getUserData() {
    try {
        const data = localStorage.getItem('userData');
        return data ? JSON.parse(data) : null;
    } catch(e) {
        console.error('Error getting user data:', e);
        return null;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getFriendRequests() {
    return JSON.parse(localStorage.getItem('friendRequests') || '[]');
}

function getFriends() {
    return JSON.parse(localStorage.getItem('friends') || '[]');
}

function isFriend(userId) {
    const currentUser = getUserData();
    if (!currentUser) return false;
    const friends = getFriends();
    return friends.some(f => (f.userId1 === currentUser.id && f.userId2 === userId) || (f.userId2 === currentUser.id && f.userId1 === userId));
}

function requestSent(userId) {
    const currentUser = getUserData();
    if (!currentUser) return false;
    const requests = getFriendRequests();
    return requests.some(r => r.fromId === currentUser.id && r.toId === userId && r.status === 'pending');
}

function sendFriendRequest(toUserId, toUserName) {
    const currentUser = getUserData();
    if (!currentUser) { alert('Please log in'); return; }
    if (isFriend(toUserId)) { alert('Already friends!'); return; }
    if (requestSent(toUserId)) { alert('Request already sent!'); return; }
    
    const requests = getFriendRequests();
    requests.push({ id: Date.now(), fromId: currentUser.id, fromName: currentUser.name, fromUsername: currentUser.username, toId: toUserId, toName: toUserName, status: 'pending', createdAt: Date.now() });
    localStorage.setItem('friendRequests', JSON.stringify(requests));
    alert('Friend request sent!');
}

function acceptFriendRequest(requestId) {
    const requests = getFriendRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) { alert('Request not found'); return; }
    const req = requests[idx];
    const currentUser = getUserData();
    if (req.toId !== currentUser.id) { alert('Not your request'); return; }
    
    requests[idx].status = 'accepted';
    localStorage.setItem('friendRequests', JSON.stringify(requests));
    
    const friends = getFriends();
    friends.push({ userId1: req.fromId, userId2: req.toId, connectedAt: Date.now() });
    localStorage.setItem('friends', JSON.stringify(friends));
    
    alert('You are now friends!');
    updateFriendNotificationBadge();
}

function updateFriendNotificationBadge() {
    const currentUser = getUserData();
    if (!currentUser) return;
    const requests = getFriendRequests();
    const pending = requests.filter(r => r.toId === currentUser.id && r.status === 'pending').length;
    const accepted = requests.filter(r => r.fromId === currentUser.id && r.status === 'accepted' && !r.seenByRequester).length;
    const total = pending + accepted;
    
    const badge = document.getElementById('friendNotificationBadge');
    if (badge) {
        if (total > 0) { badge.textContent = total; badge.style.display = 'flex'; }
        else { badge.style.display = 'none'; }
    }
}

function showFriendRequestsModal() {
    const currentUser = getUserData();
    if (!currentUser) return;
    
    const requests = getFriendRequests();
    const pending = requests.filter(r => r.toId === currentUser.id && r.status === 'pending');
    const accepted = requests.filter(r => r.fromId === currentUser.id && r.status === 'accepted');
    
    requests.forEach(r => { if (r.fromId === currentUser.id && r.status === 'accepted') r.seenByRequester = true; });
    localStorage.setItem('friendRequests', JSON.stringify(requests));
    updateFriendNotificationBadge();
    
    let html = '';
    if (pending.length === 0 && accepted.length === 0) html = '<p class="no-users-message">No friend requests</p>';
    else {
        if (pending.length > 0) {
            html += '<h4>Pending Requests</h4>';
            pending.forEach(req => {
                html += '<div class="friend-request-item"><div class="friend-request-info"><strong>' + escapeHtml(req.fromName) + '</strong><span>@' + escapeHtml(req.fromUsername || 'unknown') + '</span></div><button class="accept-btn" onclick="acceptFriendRequest(' + req.id + ')">Accept</button></div>';
            });
        }
        if (accepted.length > 0) {
            html += '<h4>Accepted</h4>';
            accepted.forEach(req => {
                html += '<div class="friend-request-item accepted"><div class="friend-request-info"><strong>' + escapeHtml(req.toName) + '</strong><span>accepted your request</span></div></div>';
            });
        }
    }
    
    const modal = document.createElement('div');
    modal.className = 'notification-modal-overlay';
    modal.id = 'friendRequestsModal';
    modal.innerHTML = '<div class="notification-modal"><div class="notification-modal-header"><h3>Friend Requests</h3><button class="notification-modal-close" onclick="this.closest(\'.notification-modal-overlay\').remove();document.body.style.overflow=\'\'">&times;</button></div><div class="notification-modal-body">' + html + '</div></div>';
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Header component loaded');
    
    // Setup navigation
    setupDashboardNavigation();
    
    // Initialize notification badge
    updateFriendNotificationBadge();
});
