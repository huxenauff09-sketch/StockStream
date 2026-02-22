// Load header HTML, initialize page and then load users from backend
fetch('../components/header.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('headerContainer').innerHTML = html;
        initializeHeader('view others');
        loadUsers();
        setupSearch();
        
        // Listen for friend request events to update buttons
        window.addEventListener('friendRequestSent', () => updateAllFriendButtons());
        window.addEventListener('friendRequestCancelled', () => updateAllFriendButtons());
    })
    .catch(error => console.error('Error loading header:', error));

// Helper function to get user data (copied from header-script)
function getUserData() {
    return JSON.parse(localStorage.getItem('userData') || 'null');
}

// Helper function to get friend requests
function getFriendRequests() {
    return JSON.parse(localStorage.getItem('friendRequests') || '[]');
}

// Helper function to check if already friends
function isFriend(userId) {
    const currentUser = getUserData();
    if (!currentUser) return false;
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    return friends.some(f => (f.userId1 === currentUser.id && f.userId2 === userId) || (f.userId2 === currentUser.id && f.userId1 === userId));
}

// Helper function to check if request already sent
function requestSent(userId) {
    const currentUser = getUserData();
    if (!currentUser) return false;
    const requests = getFriendRequests();
    return requests.some(r => r.fromId === currentUser.id && r.toId === userId && r.status === 'pending');
}

// Fetch registered users from backend and render them
async function loadUsers() {
    const usersGrid = document.getElementById('usersGrid');
    const currentUser = JSON.parse(localStorage.getItem('userData') || 'null');
    const requests = getFriendRequests();
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');

    usersGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>Loading users...</p></div>';

    try {
        const res = await fetch('http://localhost:3000/users/display');
        if (!res.ok) throw new Error('Failed to fetch users: ' + res.status);
        const users = await res.json();

        if (!Array.isArray(users) || users.length === 0) {
            usersGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>No registered users found</p></div>';
            return;
        }

        // Exclude current user if logged in
        const filtered = users.filter(u => String(u.id) !== String(currentUser && currentUser.id));

        if (filtered.length === 0) {
            usersGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>No other users found</p></div>';
            return;
        }

        // Render user cards with appropriate button states
        usersGrid.innerHTML = filtered.map(user => {
            // Determine button state
            let buttonText = 'Add Friend';
            let buttonClass = 'btn-friend';
            let buttonAction = `sendFriendRequest('${user.id}', '${escapeHtml(user.name || '')}')`;
            
            const isAlreadyFriend = friends.some(f => 
                (f.userId1 === currentUser.id && f.userId2 === user.id) || 
                (f.userId2 === currentUser.id && f.userId1 === user.id)
            );
            
            const hasPendingRequest = requests.some(r => 
                r.fromId === currentUser.id && r.toId === user.id && r.status === 'pending'
            );
            
            const receivedRequest = requests.some(r => 
                r.toId === currentUser.id && r.fromId === user.id && r.status === 'pending'
            );
            
            if (isAlreadyFriend) {
                buttonText = 'Friends';
                buttonClass = 'btn-friends';
                buttonAction = '';
            } else if (hasPendingRequest) {
                buttonText = 'Cancel Request';
                buttonClass = 'btn-cancel-request';
                buttonAction = `cancelFriendRequest('${user.id}')`;
            } else if (receivedRequest) {
                buttonText = 'Respond';
                buttonClass = 'btn-respond';
                buttonAction = 'showFriendRequestsModal()';
            }
            
            return `
                <div class="user-card" data-user-id="${user.id}" data-user-name="${escapeHtml(user.name || '')}" data-user-email="${escapeHtml(user.email || '')}">
                    <div class="user-avatar">👤</div>
                    <div class="user-name">${escapeHtml(user.name || ('user' + (user.id || '')))}</div>
                    <div class="user-email">${escapeHtml(user.email || '')}</div>
                    <div class="user-actions">
                        <button class="btn-action btn-view" onclick="viewProfile('${user.id}')">View Profile</button>
                        <button class="btn-action ${buttonClass}" onclick="${buttonAction}">${buttonText}</button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Error loading users:', err);
        usersGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Failed to load users. Ensure backend is running.</p></div>';
    }
}

// Search input filters user cards dynamically after render
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const q = (e.target.value || '').toLowerCase();
        const cards = document.querySelectorAll('.user-card');

        cards.forEach(card => {
            const name = (card.getAttribute('data-user-name') || '').toLowerCase();
            const email = (card.getAttribute('data-user-email') || '').toLowerCase();
            if (name.includes(q) || email.includes(q)) card.style.display = '';
            else card.style.display = 'none';
        });
    });
}

function viewProfile(userId) {
    // Open modal with user profile details instead of navigating
    showUserProfileModal(userId);
}

async function showUserProfileModal(userId) {
    try {
        const res = await fetch('http://localhost:3000/users/' + encodeURIComponent(userId));
        if (!res.ok) throw new Error('Failed to fetch user: ' + res.status);
        const user = await res.json();
        
        // Check friend status
        const currentUser = getUserData();
        const requests = getFriendRequests();
        const friends = JSON.parse(localStorage.getItem('friends') || '[]');
        
        let buttonText = 'Add Friend';
        let buttonClass = 'btn btn-primary';
        let buttonAction = `sendFriendRequest('${user.id}', '${escapeHtml(user.name || '')}')`;
        
        const isAlreadyFriend = friends.some(f => 
            (f.userId1 === currentUser?.id && f.userId2 === user.id) || 
            (f.userId2 === currentUser?.id && f.userId1 === user.id)
        );
        
        const hasPendingRequest = requests.some(r => 
            r.fromId === currentUser?.id && r.toId === user.id && r.status === 'pending'
        );
        
        if (isAlreadyFriend) {
            buttonText = 'Friends';
            buttonClass = 'btn btn-secondary';
            buttonAction = '';
        } else if (hasPendingRequest) {
            buttonText = 'Cancel Request';
            buttonClass = 'btn btn-cancel-request';
            buttonAction = `cancelFriendRequest('${user.id}')`;
        }

        const html = `
        <div class="profile-full" data-user-id="${user.id}">
            <div class="profile-header">
                <div class="profile-avatar">👤</div>
                <div class="profile-info">
                    <h1>${escapeHtml(user.name || 'User')}</h1>
                    <div class="profile-email">${escapeHtml(user.email || '')}</div>
                    <p>${escapeHtml(user.bio || '')}</p>

                    <div class="profile-stats">
                        <div class="stat-box"><div class="stat-value">${user.tasks || 0}</div><div class="stat-label">Total Tasks</div></div>
                        <div class="stat-box"><div class="stat-value">${user.completedTasks || 0}</div><div class="stat-label">Completed</div></div>
                        <div class="stat-box"><div class="stat-value">${user.friends || 0}</div><div class="stat-label">Friends</div></div>
                    </div>

                    <div class="action-buttons">
                        <button class="${buttonClass}" id="profileFriendBtn" onclick="${buttonAction}">${buttonText}</button>
                        <button class="btn btn-secondary" id="messageBtn">Message</button>
                    </div>
                </div>
                <button class="profile-close" id="closeProfileOverlay">&times;</button>
            </div>

            <div class="section">
                <div class="section-title">Profile Details</div>
                <div class="info-item"><span class="info-label">Email</span><span class="info-value">${escapeHtml(user.email || '')}</span></div>
                <div class="info-item"><span class="info-label">Joined</span><span class="info-value">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</span></div>
                <div class="info-item"><span class="info-label">Status</span><span class="info-value"><span class="badge">${user.isActive ? '✓ Active' : 'Inactive'}</span></span></div>
            </div>

            <div class="section">
                <div class="section-title">Activity Summary</div>
                <div class="info-item"><span class="info-label">Completion Rate</span><span class="info-value">${user.tasks ? Math.round((user.completedTasks || 0) / user.tasks * 100) + '%' : '0%'}</span></div>
                <div class="info-item"><span class="info-label">Active Since</span><span class="info-value">${user.activeSince || '—'}</span></div>
                <div class="info-item"><span class="info-label">Last Activity</span><span class="info-value">${user.lastActivity || '—'}</span></div>
            </div>
        </div>
    `;

        // Remove any existing profile overlay first
        const existingOverlay = document.getElementById('userProfileModal');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'profile-overlay';
        overlay.id = 'userProfileModal';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // Close on clicking outside the profile content
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                document.body.style.overflow = '';
            }
        });

        document.getElementById('closeProfileOverlay').addEventListener('click', () => {
            overlay.remove();
            document.body.style.overflow = '';
        });

        // optional message button handler
        const msgBtn = document.getElementById('messageBtn');
        if (msgBtn) msgBtn.addEventListener('click', () => { alert('Open messaging for ' + (user.name || user.email)); });

    } catch (err) {
        console.error('Error loading profile:', err);
        alert('Failed to load profile. Ensure backend is running.');
        return;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}
