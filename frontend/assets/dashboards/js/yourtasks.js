// Load header HTML
fetch('../components/header.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('headerContainer').innerHTML = html;
        // Initialize header for this page
        initializeHeader('your tasks');
        // Load tasks
        loadTasks();
    })
    .catch(error => console.error('Error loading header:', error));

// Load user's tasks from backend
async function loadTasks() {
    const user = JSON.parse(localStorage.getItem('userData') || 'null');
    const tasksContainer = document.getElementById('tasksContainer');
    if (!user || !user.id) {
        tasksContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>Please log in to view your tasks</p></div>';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/tasks/user/' + encodeURIComponent(user.id));
        if (!res.ok) throw new Error('Failed to fetch tasks: ' + res.status);
        const tasks = await res.json();

        if (!Array.isArray(tasks) || tasks.length === 0) {
            tasksContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No tasks yet. Check back later!</p></div>';
            return;
        }

        tasksContainer.innerHTML = tasks.map(task => `
            <div class="task-card ${task.status === 'completed' ? 'completed' : ''}">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-description-section">
                    <div class="task-description">${escapeHtml(task.description || task.projectContent || '')}</div>
                </div>
                <div class="task-divider-section">
                    <span class="task-date">${new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="task-card-actions">
                    <button class="task-btn" onclick="handleTaskAction('complete', ${task.id})">Complete</button>
                    <button class="task-btn" onclick="handleTaskAction('edit', ${task.id})">Edit</button>
                    <button class="task-btn" onclick="handleTaskAction('revoke', ${task.id})">Revoke</button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error loading user tasks:', err);
        tasksContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Failed to load tasks. Ensure backend is running.</p></div>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleTaskAction(action, taskId) {
    console.log(`${action} task:`, taskId);
    // Implementation for Complete, Edit, Revoke actions
}
