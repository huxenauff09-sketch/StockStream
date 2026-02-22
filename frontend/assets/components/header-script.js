/**
 * Universal Header Component Script
 * Manages header functionality for dashboard pages
 * Usage: Call initializeHeader(currentPage) in your page's DOMContentLoaded event
 * where currentPage is one of: 'dashboard', 'your tasks', 'credentials', 'view others', 'view profile'
 */

// ===== GLOBAL FUNCTION TO REMOVE STUCK OVERLAYS =====
function clearAllOverlays() {
    document.querySelectorAll('.profile-overlay, .notification-modal-overlay, .custom-alert-overlay, .loading-screen-overlay, .account-settings-modal-overlay').forEach(el => el.remove());
    document.body.style.overflow = '';
}

// Make it globally accessible
window.clearAllOverlays = clearAllOverlays;

// ===== CUSTOM MODAL ALERT FUNCTION =====
function showModalAlert(message, isDanger = false) {
    // Remove any existing custom alert first
    const existingAlert = document.querySelector('.custom-alert-overlay');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const escaped = String(message)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    const modal = document.createElement('div');
    modal.className = 'custom-alert-overlay';
    
    const alertClass = isDanger ? 'custom-alert-danger' : 'custom-alert-success';
    const buttonColor = isDanger ? '#d9534f' : '#22c55e';
    const icon = isDanger ? '⚠️' : '✓';
    
    modal.innerHTML = `
        <div class="custom-alert ${alertClass}">
            <div class="custom-alert-icon">${icon}</div>
            <div class="custom-alert-message">${escaped}</div>
            <button class="custom-alert-btn" onclick="this.closest('.custom-alert-overlay').remove()" style="background-color: ${buttonColor};">OK</button>
        </div>
    `;
    document.body.appendChild(modal);
    console.log('Modal alert shown:', message);
}

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

// ===== PROFILE PAGE NAVIGATION =====
function navigateToAccountSettings() {
    // Get the base path and navigate to account settings
    const basePath = window.location.pathname.split('/assets/')[0];
    window.location.href = basePath + '/assets/components/accountsettings/accountsettings.html';
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
    // StockStream button - Navigate to dashboard root
    const stockstreamNavBtn = document.getElementById('stockstreamNavBtn');
    if (stockstreamNavBtn) {
        stockstreamNavBtn.addEventListener('click', () => {
            window.location.href = '../dashboards/Dashboard.html';
        });
    }
    
    // Dashboard button
    const dashboardsTab = document.querySelector('.top-row-item[data-row="dashboard"]');
    if (dashboardsTab) {
        dashboardsTab.addEventListener('click', () => {
            window.location.href = './Dashboard.html';
        });
    }
    
    // Your Tasks button
    const yourTasksBtn = document.querySelector('.top-row-item[data-row="your tasks"]');
    if (yourTasksBtn) {
        yourTasksBtn.addEventListener('click', () => {
            window.location.href = './YourTasks.html';
        });
    }
    
    // Credits (formerly Credentials) button
    const credentialsBtn = document.querySelector('.top-row-item[data-row="credits"]');
    if (credentialsBtn) {
        credentialsBtn.addEventListener('click', () => {
            window.location.href = './Credentials.html';
        });
    }
    
    // View Others button
    const viewOthersBtn = document.querySelector('.top-row-item[data-row="view others"]');
    if (viewOthersBtn) {
        viewOthersBtn.addEventListener('click', () => {
            window.location.href = './ViewOthers.html';
        });
    }
    
    // View Profile button
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

// ===== USER DATA HELPERS =====
function getUserData() {
    try {
        const data = localStorage.getItem('userData');
        return data ? JSON.parse(data) : null;
    } catch(e) {
        console.error('Error getting user data:', e);
        return null;
    }
}

function renderUserDisplay() {
    const user = getUserData();
    const userDisplay = document.getElementById('userDisplay');
    
    if (!user || !userDisplay) return;
    
    const displayName = user.name || user.username || user.email || 'User';
    userDisplay.innerHTML = `<span><strong>${escapeHtml(displayName)}</strong></span>`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== LOGOUT HANDLER =====
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('doLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userData');
            localStorage.removeItem('authToken');
            window.location.href = '../login/login.html';
        });
    }
}

// ===== FRIEND REQUEST SYSTEM =====
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
    console.log('sendFriendRequest called:', toUserId, toUserName);
    const currentUser = getUserData();
    console.log('Current user:', currentUser);
    if (!currentUser) { 
        alert('Please log in to send friend requests'); 
        return; 
    }
    
    // Prevent self-requests
    if (String(toUserId) === String(currentUser.id)) { 
        alert('You cannot send a friend request to yourself'); 
        return; 
    }
    
    if (isFriend(toUserId)) { alert('You are already friends with this user'); return; }
    if (requestSent(toUserId)) { alert('Friend request already sent'); return; }
    
    const requests = getFriendRequests();
    requests.push({ 
        id: Date.now(), 
        fromId: currentUser.id, 
        fromName: currentUser.name, 
        fromUsername: currentUser.username, 
        toId: toUserId, 
        toName: toUserName, 
        status: 'pending', 
        createdAt: Date.now() 
    });
    localStorage.setItem('friendRequests', JSON.stringify(requests));
    console.log('Friend request saved to localStorage');
    
    // Reload the users list to update button states (for ViewOthers page)
    if (typeof loadUsers === 'function') {
        console.log('Calling loadUsers...');
        loadUsers();
    } else {
        console.log('loadUsers not found');
    }
    
    // Note: We don't update notification badge here because this is an OUTGOING request.
    // The notification badge shows INCOMING requests to the current user.
    // The recipient will see the notification when they log in.
    
    // Trigger custom event for other pages to update
    window.dispatchEvent(new CustomEvent('friendRequestSent', { detail: { toUserId: toUserId } }));
}

// Update a specific friend button by user ID
function updateFriendButtonState(userId, state) {
    // Find button in user cards
    const userCard = document.querySelector(`.user-card[data-user-id="${userId}"]`);
    if (userCard) {
        const friendBtn = userCard.querySelector('.btn-friend, .btn-cancel-request, .btn-friends, .btn-respond');
        if (friendBtn) {
            if (state === 'cancel') {
                friendBtn.textContent = 'Cancel Request';
                friendBtn.className = 'btn-action btn-cancel-request';
                friendBtn.onclick = () => cancelFriendRequest(userId);
            }
        }
    }
    
    // Also check profile modal if open
    const profileModal = document.querySelector('.profile-overlay');
    if (profileModal) {
        const modalBtn = profileModal.querySelector('.btn-friend, .btn-cancel-request, .btn-friends, .btn-respond');
        if (modalBtn) {
            if (state === 'cancel') {
                modalBtn.textContent = 'Cancel Request';
                modalBtn.className = 'btn btn-cancel-request';
                modalBtn.onclick = () => cancelFriendRequest(userId);
            }
        }
    }
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
    
    alert('You are now friends with ' + req.fromName + '!');
    updateFriendNotificationBadge();
    
    // Refresh the modal to show updated state
    showFriendRequestsModal();
    
    // Update all buttons
    updateAllFriendButtons();
    
    // Reload users if on ViewOthers page
    if (typeof loadUsers === 'function') {
        loadUsers();
    }
}

function rejectFriendRequest(requestId) {
    const requests = getFriendRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) { alert('Request not found'); return; }
    
    const req = requests[idx];
    const currentUser = getUserData();
    if (req.toId !== currentUser.id) { alert('Not your request'); return; }
    
    // Remove the request
    requests.splice(idx, 1);
    localStorage.setItem('friendRequests', JSON.stringify(requests));
    
    alert('Friend request rejected');
    updateFriendNotificationBadge();
    
    // Refresh the modal to show updated state
    showFriendRequestsModal();
}

function cancelFriendRequest(toUserId) {
    const currentUser = getUserData();
    if (!currentUser) { alert('Please log in'); return; }
    
    const requests = getFriendRequests();
    const idx = requests.findIndex(r => r.fromId === currentUser.id && r.toId === toUserId && r.status === 'pending');
    
    if (idx === -1) { alert('No pending request found'); return; }
    
    requests.splice(idx, 1);
    localStorage.setItem('friendRequests', JSON.stringify(requests));
    
    // Update button back to Add Friend
    updateFriendButtonState(toUserId, 'add');
    
    // Reload the users list to update button states (for ViewOthers page)
    if (typeof loadUsers === 'function') {
        loadUsers();
    }
    
    // Update notification badge
    updateFriendNotificationBadge();
    
    // Update all Add Friend buttons
    updateAllFriendButtons();
    
    // Trigger custom event for other pages to update
    window.dispatchEvent(new CustomEvent('friendRequestCancelled', { detail: { toUserId: toUserId } }));
}

// Update button state helper
function updateFriendButtonState(userId, state) {
    // Find button in user cards
    const userCard = document.querySelector(`.user-card[data-user-id="${userId}"]`);
    if (userCard) {
        const friendBtn = userCard.querySelector('.btn-friend, .btn-cancel-request, .btn-friends, .btn-respond');
        if (friendBtn) {
            if (state === 'add') {
                friendBtn.textContent = 'Add Friend';
                friendBtn.className = 'btn-action btn-friend';
                friendBtn.onclick = () => {
                    const userName = userCard.getAttribute('data-user-name') || 'User';
                    sendFriendRequest(userId, userName);
                };
            } else if (state === 'cancel') {
                friendBtn.textContent = 'Cancel Request';
                friendBtn.className = 'btn-action btn-cancel-request';
                friendBtn.onclick = () => cancelFriendRequest(userId);
            }
        }
    }
    
    // Also check profile modal if open
    const profileModal = document.querySelector('.profile-overlay');
    if (profileModal) {
        const modalBtn = profileModal.querySelector('.btn-friend, .btn-cancel-request, .btn-friends, .btn-respond');
        if (modalBtn) {
            if (state === 'add') {
                modalBtn.textContent = 'Add Friend';
                modalBtn.className = 'btn btn-primary';
                modalBtn.onclick = () => {
                    const userName = profileModal.querySelector('h1')?.textContent || 'User';
                    sendFriendRequest(userId, userName);
                };
            } else if (state === 'cancel') {
                modalBtn.textContent = 'Cancel Request';
                modalBtn.className = 'btn btn-cancel-request';
                modalBtn.onclick = () => cancelFriendRequest(userId);
            }
        }
    }
}

// Update all "Add Friend" buttons to show appropriate state based on friend request status
function updateAllFriendButtons() {
    const currentUser = getUserData();
    if (!currentUser) return;
    
    const requests = getFriendRequests();
    const friends = getFriends();
    
    // Find all Add Friend buttons on the page
    const addFriendButtons = document.querySelectorAll('.btn-friend, [onclick*="sendFriendRequest"]');
    
    addFriendButtons.forEach(btn => {
        // Extract user ID from onclick or data attribute
        let userId = null;
        
        // Try to get from data attribute
        const card = btn.closest('.user-card');
        if (card) {
            userId = card.getAttribute('data-user-id');
        }
        
        // Try from onclick attribute
        if (!userId && btn.getAttribute('onclick')) {
            const match = btn.getAttribute('onclick').match(/['"]([^'"]+)['"]/);
            if (match) {
                userId = match[1];
            }
        }
        
        if (!userId) return;
        
        // Check status
        const isAlreadyFriend = friends.some(f => 
            (f.userId1 === currentUser.id && f.userId2 === userId) || 
            (f.userId2 === currentUser.id && f.userId1 === userId)
        );
        
        const hasPendingRequest = requests.some(r => 
            r.fromId === currentUser.id && r.toId === userId && r.status === 'pending'
        );
        
        const receivedPendingRequest = requests.some(r => 
            r.toId === currentUser.id && r.fromId === userId && r.status === 'pending'
        );
        
        // Update button text and onclick
        if (isAlreadyFriend) {
            btn.textContent = 'Friends';
            btn.classList.add('btn-friends');
            btn.classList.remove('btn-friend', 'btn-cancel-request');
            btn.disabled = true;
        } else if (hasPendingRequest) {
            btn.textContent = 'Cancel Request';
            btn.classList.add('btn-cancel-request');
            btn.classList.remove('btn-friend', 'btn-friends');
            btn.disabled = false;
            btn.onclick = () => cancelFriendRequest(userId);
        } else if (receivedPendingRequest) {
            btn.textContent = 'Respond';
            btn.classList.add('btn-respond');
            btn.classList.remove('btn-friend', 'btn-friends', 'btn-cancel-request');
            btn.disabled = false;
        } else {
            btn.textContent = 'Add Friend';
            btn.classList.add('btn-friend');
            btn.classList.remove('btn-friends', 'btn-cancel-request', 'btn-respond');
            btn.disabled = false;
            // Restore original onclick - will be set when re-rendering
        }
    });
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
        if (total > 0) { 
            badge.textContent = total; 
            badge.style.display = 'flex'; 
        }
        else { 
            badge.style.display = 'none'; 
        }
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
    if (pending.length === 0 && accepted.length === 0) {
        html = '<p class="no-users-message">No friend requests</p>';
    } else {
        if (pending.length > 0) {
            html += '<h4>Pending Requests</h4>';
            pending.forEach(req => {
                html += '<div class="friend-request-item"><div class="friend-request-info"><strong>' + escapeHtml(req.fromName) + '</strong><span>@' + escapeHtml(req.fromUsername || 'unknown') + '</span></div><div class="friend-request-actions"><button class="accept-btn" onclick="acceptFriendRequest(' + req.id + ')">Accept</button><button class="reject-btn" onclick="rejectFriendRequest(' + req.id + ')">Reject</button></div></div>';
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

// ===== MAIN INITIALIZATION FUNCTION =====
/**
 * Initialize header for a dashboard page
 * @param {string} currentPage - The current page name to mark as active
 *                              Options: 'dashboard', 'your tasks', 'credentials', 'view others', 'view profile'
 */
function initializeHeader(currentPage) {
    // Check authentication
    const user = getUserData();
    if (!user) {
        console.warn('No user data found. Redirecting to login...');
        window.location.href = '../login/login.html';
        return;
    }
    
    console.log('Initializing header for page:', currentPage);
    
    // Setup navigation
    setupDashboardNavigation();
    
    // Render user display
    renderUserDisplay();
    
    // Setup logout handler
    setupLogoutHandler();
    
    // Mark active tab
    markActiveTab(currentPage);
    
    // Initialize notification badge
    updateFriendNotificationBadge();

    // Make header/top-rows occupy fixed space and set CSS variable for content area
    try {
        // compute total header height (header + top rows)
        const headerEl = document.querySelector('.dashboard-header');
        const topRowsEl = document.querySelector('.top-rows');
        const headerHeight = headerEl ? headerEl.offsetHeight : 0;
        const topRowsHeight = topRowsEl ? topRowsEl.offsetHeight : 0;
        const total = headerHeight + topRowsHeight;
        document.documentElement.style.setProperty('--header-total-height', total + 'px');

        // position top-rows just under header
        if (topRowsEl) topRowsEl.style.top = headerHeight + 'px';

        // ensure page-content elements adjust to new header height
        document.querySelectorAll('.page-content').forEach(pc => {
            pc.style.marginTop = 'calc(var(--header-total-height) )';
            pc.style.height = 'calc(100vh - var(--header-total-height))';
            pc.style.overflow = 'auto';
        });
    } catch (e) {
        console.error('Error adjusting header layout:', e);
    }
}
