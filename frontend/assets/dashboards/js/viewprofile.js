// Load header HTML
fetch('../components/header.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('headerContainer').innerHTML = html;
        // Initialize header for this page
        initializeHeader('view profile');
        // Load profile
        loadProfile();
    })
    .catch(error => console.error('Error loading header:', error));

function loadProfile() {
    const profileContainer = document.getElementById('profileContainer');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    // Get current logged-in user from localStorage (backend session should populate this)
    let stored = JSON.parse(localStorage.getItem('userData') || 'null');
    
    // Count stats from localStorage
    const userTasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    
    // Calculate user's stats based on localStorage data
    const tasksTaken = userTasks.length;
    const completedCount = completedTasks.filter(t => 
        t.completedBy && stored && (t.completedBy === stored.username || t.completedBy === stored.email)
    ).length;
    const friendsCount = friends.length;
    
    // If no stored user, create default
    let user = stored || {
        id: userId || '1',
        name: 'Alice Johnson',
        username: 'alice',
        email: 'alice@example.com',
        joinDate: 'January 15, 2026',
        tasksCreated: 15,
        completedTasks: 12,
        friends: 8,
        bio: 'StockStream enthusiast and developer'
    };

    // Use calculated counts if user is logged in
    if (stored) {
        user.tasksTaken = tasksTaken;
        user.completedTasks = completedCount;
        user.friends = friendsCount;
    }

    // Normalize keys and use tasksTaken instead of tasksCreated
    user.tasksTaken = Number(user.tasksTaken || user.tasksCreated || user.tasks || tasksTaken || 0);
    user.completedTasks = Number(user.completedTasks || completedCount || 0);
    user.friends = Number(user.friends || friendsCount || (user.friendsList ? user.friendsList.length : 0));

    // Save normalized user back so further changes persist
    localStorage.setItem('userData', JSON.stringify(user));

    const html = `
        <div class="profile-header">
            <div class="profile-avatar">👤</div>
            <div class="profile-info">
                <h1 id="profileName">${escapeHtml(user.name)}</h1>
                <div class="profile-username" id="profileUsername">@${escapeHtml(user.username || user.email || 'user')}</div>
                <p id="profileBio">${escapeHtml(user.bio || '')}</p>

                <div class="profile-stats">
                    <div class="stat-box">
                        <div class="stat-value" id="stat-tasks-taken">${user.tasksTaken}</div>
                        <div class="stat-label">Tasks Taken</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value" id="stat-completed">${user.completedTasks}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value" id="stat-friends">${user.friends}</div>
                        <div class="stat-label">Friends</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value" id="stat-rate">${computeCompletionRate(user)}</div>
                        <div class="stat-label">Completion Rate</div>
                    </div>
                </div>

                <div class="action-buttons"></div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Profile Details</div>
            <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${escapeHtml(user.email)}</span>
            </div>
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value"><span class="badge">✓ Active</span></div>
            </div>
        </div>
    `;

    profileContainer.classList.remove('loading');
    profileContainer.innerHTML = html;

    // expose functions to adjust tasksTaken from other modules (no UI buttons)
    window.changeTasksTaken = function (delta) {
        const stored = JSON.parse(localStorage.getItem('userData') || 'null');
        if (!stored) return console.warn('No user session found');

        if (typeof stored.tasksTaken === 'undefined') stored.tasksTaken = 0;
        stored.tasksTaken = Number(stored.tasksTaken) + Number(delta);
        if (stored.tasksTaken < 0) stored.tasksTaken = 0;

        // ensure completedTasks never exceeds tasksTaken
        if (stored.completedTasks > stored.tasksTaken) stored.completedTasks = stored.tasksTaken;

        localStorage.setItem('userData', JSON.stringify(stored));
        // update DOM
        updateStatUI(stored);
    };

    window.updateStatUI = function (u) {
        document.getElementById('stat-tasks-taken').textContent = u.tasksTaken;
        document.getElementById('stat-completed').textContent = u.completedTasks;
        document.getElementById('stat-friends').textContent = u.friends;
        document.getElementById('stat-rate').textContent = computeCompletionRate(u);
    };
}

function computeCompletionRate(user) {
    const taken = Number(user.tasksTaken || 0);
    const completed = Number(user.completedTasks || 0);
    if (taken === 0) return '0%';
    return Math.round((completed / taken) * 100) + '%';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
