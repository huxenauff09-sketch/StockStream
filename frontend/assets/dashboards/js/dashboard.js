// script load confirmation
console.log('dashboard.js loaded');

// ===== CUSTOM MODAL ALERT FUNCTIONS =====
// Display custom modal alert (danger operations: delete, revoke, etc.)
function showModalAlert(message, isDanger = false) {
    // Escape HTML inline
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

// Display loading screen with message
function showLoadingScreen(message = 'Loading...', duration = 1000) {
    // Remove any existing loading screens first
    const existingScreen = document.getElementById('loadingScreen');
    if (existingScreen) {
        existingScreen.remove();
    }
    
    // Escape HTML inline
    const escaped = String(message)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    const modal = document.createElement('div');
    modal.className = 'loading-screen-overlay';
    modal.id = 'loadingScreen';
    modal.innerHTML = `
        <div class="loading-screen">
            <div class="loading-spinner"></div>
            <div class="loading-text">${escaped}</div>
        </div>
    `;
    document.body.appendChild(modal);
    console.log('Loading screen shown:', message);
    
    setTimeout(() => {
        const screen = document.getElementById('loadingScreen');
        if (screen) {
            screen.remove();
        }
    }, duration);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Load header HTML
fetch('../components/header.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('headerContainer').innerHTML = html;
        // Initialize header for this page
        initializeHeader('dashboard');
        // Load dashboard data
        loadDashboardData();
        // Setup menu handlers
        setupMenuHandlers();
        // Setup form handlers
        setupFormHandlers();
        // if query param wants a section, switch to it
        const params = new URLSearchParams(window.location.search);
        const sec = params.get('section');
        if (sec) {
            // find corresponding button and activate
            const btn = document.querySelector(`.menu-btn[data-menu="${sec}"]`);
            if (btn) {
                btn.classList.add('active');
                switchSection(sec);
            }
        }
    })
    .catch(error => console.error('Error loading header:', error));

// Load dashboard statistics
function loadDashboardData() {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    const allFriends = JSON.parse(localStorage.getItem('friends') || '[]');
    // Count only accepted friends
    const acceptedFriends = allFriends.filter(f => f.status === 'accepted');

    // Fetch tasks and users from backend where possible; fall back on local or zero values
    Promise.all([
        fetch('http://localhost:3000/tasks')
            .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .catch(err => {
                console.warn('Task fetch failed, using stored tasks or empty', err);
                return JSON.parse(localStorage.getItem('userTasks') || '[]');
            }),
        fetch('http://localhost:3000/users')
            .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .catch(err => {
                console.warn('User fetch failed, defaulting to []', err);
                return [];
            })
    ]).then(([tasks, users]) => {
        const currentUser = JSON.parse(localStorage.getItem('userData') || 'null');
        
        // Available tasks (for the View Tasks section)
        const allTasks = Array.isArray(tasks) ? tasks : [];
        const availableTasks = allTasks.filter(t => t.isAvailable);
        const totalAvailableTasks = availableTasks.length;
        
        // Count completed tasks by CURRENT USER
        const userCompletedTasks = allTasks.filter(t => 
            t.completedBy && 
            (t.completedBy === currentUser?.username || t.completedBy === currentUser?.email)
        ).length;
        
        // Also check localStorage for completed tasks
        const localCompleted = JSON.parse(localStorage.getItem('completedTasks') || '[]');
        const localUserCompleted = localCompleted.filter(t => 
            t.completedBy && 
            (t.completedBy === currentUser?.username || t.completedBy === currentUser?.email)
        ).length;
        const totalUserCompleted = userCompletedTasks + localUserCompleted;
        
        // Total users on platform
        const totalUsers = Array.isArray(users) ? users.length : 0;
        
        // Count user's taken tasks (from userTasks in localStorage)
        const userTasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
        const userTakenTasks = userTasks.length;
        
        // Friends count
        const friends = JSON.parse(localStorage.getItem('friends') || '[]');
        const acceptedFriends = friends.filter(f => f.status === 'accepted' || f.userId1 === currentUser?.id || f.userId2 === currentUser?.id);
        
        // Calculate completion rate: (completed / taken) * 100
        const completionRate = userTakenTasks > 0 ? Math.round((totalUserCompleted / userTakenTasks) * 100) : 0;
        
        document.getElementById('totalTasks').textContent = totalAvailableTasks;
        document.getElementById('completedTasks').textContent = totalUserCompleted;
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalFriends').textContent = acceptedFriends.length;
        document.getElementById('completionRate').textContent = completionRate + '%';
    }).catch(err => {
        // This should rarely happen but log anyway
        console.error('Unexpected error computing dashboard data:', err);
    });
}

// Setup menu button handlers
function setupMenuHandlers() {
    const menuButtons = document.querySelectorAll('.menu-btn');
    
    menuButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const menuId = this.getAttribute('data-menu');
            switchSection(menuId);
            
            // Update active button state
            menuButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Switch between sections
function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show the selected section
    const sectionMap = {
        'create-task': 'create-task-section',
        'view-tasks': 'view-tasks-section',
        'view-friends': 'view-friends-section',
        'completed-tasks': 'completed-tasks-section'
    };
    
    const targetSection = sectionMap[sectionId];
    if (targetSection) {
        const section = document.getElementById(targetSection);
        if (section) {
            section.classList.add('active');
            
            // Load content based on section
            if (sectionId === 'view-tasks') {
                loadTasks();
            } else if (sectionId === 'view-friends') {
                loadFriends();
            } else if (sectionId === 'completed-tasks') {
                loadCompletedTasks();
            }
        }
    }
}

// Load and display available tasks
function loadTasks() {
    fetch('http://localhost:3000/tasks')
        .then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(allTasks => {
            const tasks = Array.isArray(allTasks) ? allTasks.filter(t => t.isAvailable) : [];
            viewTasksInterface(tasks);
        })
        .catch(err => {
            console.error('Failed to fetch tasks from backend:', err);
            // connection refused or other error; try using locally stored tasks for dev
            const saved = JSON.parse(localStorage.getItem('userTasks') || '[]');
            if (saved.length) {
                console.log('Using tasks from localStorage fallback');
                viewTasksInterface(saved);
            } else {
                // optional: populate with dummy data so you can click "View" during development
                const dummy = [
                    { title: 'Sample task', description: 'This is a demo task.', author: 'dev@example.com', isAvailable: true },
                ];
                viewTasksInterface(dummy);
            }
        });
}

// Render the view‑tasks interface given an array of task objects
function viewTasksInterface(tasks) {
    const container = document.getElementById('tasksContainer');
    const noMessage = document.getElementById('noTasksMessage');

    container.innerHTML = '';

    if (tasks.length === 0) {
        container.classList.add('hidden');
        noMessage.classList.add('show');
    } else {
        container.classList.remove('hidden');
        noMessage.classList.remove('show');

        tasks.forEach(task => {
            const taskCard = createTaskCard(task, false);
            container.appendChild(taskCard);
        });
    }
}

// Load and display completed tasks (backend + localStorage)
function loadCompletedTasks() {
    Promise.all([
        fetch('http://localhost:3000/tasks').then(r => r.ok ? r.json() : []).catch(() => []),
        Promise.resolve(JSON.parse(localStorage.getItem('completedTasks') || '[]'))
    ]).then(([allTasks, localCompleted]) => {
        // combine lists, prioritise backend, but append local if not present
        let tasks = Array.isArray(allTasks) ? allTasks.filter(t => t.status === 'completed') : [];
        if (Array.isArray(localCompleted)) {
            localCompleted.forEach(t => {
                if (!tasks.find(x => x.id && t.id && x.id === t.id)) {
                    tasks.push(t);
                }
            });
        }
        const container = document.getElementById('completedTasksContainer');
        const noMessage = document.getElementById('noCompletedMessage');
        
        container.innerHTML = '';
        
        if (tasks.length === 0) {
            container.classList.add('hidden');
            noMessage.classList.add('show');
        } else {
            container.classList.remove('hidden');
            noMessage.classList.remove('show');
            
            tasks.forEach(task => {
                const taskCard = createTaskCard(task, true);
                container.appendChild(taskCard);
            });
        }
    });
}

// Create a task card element
function createTaskCard(task, isCompleted = false) {
    const card = document.createElement('div');
    card.className = 'task-card';
    
    const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
    // Check if current user is the author - use userId if available, fallback to username/email
    const isOwner = (task.userId && currentUser.id && task.userId === currentUser.id) || 
                    (currentUser.username === task.author || currentUser.email === task.author);
    const userTasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
    const isTaskTaken = userTasks.some(t => (t.title === task.title && t.author === task.author) || (t.id && task.id && t.id === task.id));
    
    // Build buttons: View is always there; Delete only for author or completer
    let buttons = '';
    if (isCompleted) {
        buttons = `<button class="task-btn task-btn-view">View</button>`;
        const isCompleter = task.completedBy === currentUser.username || task.completedBy === currentUser.email;
        // Delete button: show if current user is the author OR the completer
        if (isOwner || isCompleter) {
            // Use a distinct class (no generic 'delete') so it doesn't trigger main delete flow
            buttons += `<button class="task-btn task-btn-delete-completed">Delete</button>`;
        }
    } else {
        // Take button: show if task not taken
        if (!isTaskTaken) {
            buttons += `<button class="task-btn task-btn-take">Take</button>`;
        }
        // View button: always show
        buttons += `<button class="task-btn task-btn-view">View</button>`;
        // Revoke button: show if task is taken by current user
        if (isTaskTaken) {
            buttons += `<button class="task-btn task-btn-revoke-return">Revoke</button>`;
        }
        // Delete button: show only if current user is the author
        if (isOwner) {
            buttons += `<button class="task-btn task-btn-delete">Delete</button>`;
        }
    }
    
    card.innerHTML = `
        <div class="task-card-title">${escapeHtml(task.title || 'Untitled')}</div>
        <div class="task-card-description">${escapeHtml(task.description || 'No description provided')}</div>
        ${isCompleted && task.content ? `<div class="task-card-submission"><strong>@${escapeHtml(task.completedBy || 'Unknown')}'s work:</strong> ${escapeHtml(task.content)}</div>` : ''}
        <div class="task-card-meta">
            ${task.author ? `By ${escapeHtml(task.author)}` : 'By Unknown'}
        </div>
        <div class="task-card-actions">
            ${buttons}
        </div>
    `;
    // store encoded task data on the card for delegation handlers
    try { card.setAttribute('data-task', encodeURIComponent(JSON.stringify(task))); } catch(e) { console.warn('Failed to set data-task', e); }
    
    // Add button event listeners
    const buttons_elements = card.querySelectorAll('.task-btn');
    // Attach direct handler for completed-delete button to avoid ambiguity
    const completedDeleteBtn = card.querySelector('.task-btn-delete-completed');
    if (completedDeleteBtn) {
        completedDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            deleteCompletedTaskFromModalObj(task);
        });
    }

    buttons_elements.forEach(btn => {
        // skip completed-delete since it has its own handler
        if (btn.className.includes('delete-completed')) return;
        btn.addEventListener('click', function(e) {
            e.preventDefault();

            let action = '';
            if (this.className.includes('take')) action = 'take';
            else if (this.className.includes('delete')) action = 'delete';
            else if (this.className.includes('revoke-return')) action = 'revoke-return';
            else action = 'view';
            handleTaskAction(task, action);
        });
    });
    
    return card;
}

// (removed delegated completed-container handler; using per-card listeners instead)

// Handle task button actions
function handleTaskAction(task, action) {
    if (action === "take") {
        console.log("Take task:", task);
        // store in user's task list (localStorage) and navigate
        const taken = JSON.parse(localStorage.getItem('userTasks') || '[]');
        // give the entry a unique id so later lookup works
        const entry = Object.assign({}, task, { status: 'in-progress' });
        if (!entry.id) entry.id = 't' + Date.now();
        taken.push(entry);
        localStorage.setItem('userTasks', JSON.stringify(taken));
        console.log('userTasks now', taken);
        showLoadingScreen('Adding task...', 1000);
        // navigate to your tasks page after loading
        setTimeout(() => {
            window.location.href = 'YourTasks.html';
        }, 1000);
    } else if (action === "view") {
        showTaskModal(task);
    } else if (action === "delete") {
        console.log("Delete button clicked on task:", task);
        console.log("completedBy field:", task.completedBy);
        
        // Create custom confirm modal
        const modal = document.createElement('div');
        modal.className = 'custom-alert-overlay';
        modal.innerHTML = `
            <div class="custom-alert custom-alert-danger">
                <div class="custom-alert-icon">⚠️</div>
                <div class="custom-alert-message">Are you sure you want to delete this task?</div>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 24px;">
                    <button onclick="this.closest('.custom-alert-overlay').remove()" style="padding: 10px 24px; background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
                        <button onclick="confirmMainDeleteTask('${encodeURIComponent(JSON.stringify(task))}')" style="padding: 10px 24px; background-color: #d9534f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else if (action === "revoke-return") {
        console.log("Revoke and return task taking:", task);
        // Create custom confirm modal
        const modal = document.createElement('div');
        modal.className = 'custom-alert-overlay';
        modal.innerHTML = `
            <div class="custom-alert custom-alert-danger">
                <div class="custom-alert-icon">⚠️</div>
                <div class="custom-alert-message">Return this task and remove it from your task list?</div>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 24px;">
                    <button onclick="this.closest('.custom-alert-overlay').remove()" style="padding: 10px 24px; background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
                        <button onclick="confirmRevolkeTask('${encodeURIComponent(JSON.stringify(task))}')" style="padding: 10px 24px; background-color: #d9534f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Revoke</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Helper function to delete task from localStorage
function deleteFromLocalStorage(task) {
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
    const availableTasks = JSON.parse(localStorage.getItem('availableTasks') || '[]');
    const userTasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
    
    // Try to delete from completedTasks
    const filteredCompleted = completedTasks.filter(t => 
        !(t.id === task.id || (t.title === task.title && t.author === task.author))
    );
    
    if (filteredCompleted.length < completedTasks.length) {
        localStorage.setItem('completedTasks', JSON.stringify(filteredCompleted));
        showLoadingScreen('Removing submission...', 1000);
        setTimeout(() => location.reload(), 1000);
        return;
    }
    
    // Try to delete from availableTasks
    const filteredAvailable = availableTasks.filter(t => 
        !(t.id === task.id || (t.title === task.title && t.author === task.author))
    );
    
    if (filteredAvailable.length < availableTasks.length) {
        localStorage.setItem('availableTasks', JSON.stringify(filteredAvailable));
        console.log('Task removed from availableTasks');
        showLoadingScreen('Deleting task...', 1000);
        setTimeout(() => location.reload(), 1000);
        return;
    }
    
    // Try to delete from userTasks
    const filteredUserTasks = userTasks.filter(t => 
        !(t.id === task.id || (t.title === task.title && t.author === task.author))
    );
    
    if (filteredUserTasks.length < userTasks.length) {
        localStorage.setItem('userTasks', JSON.stringify(filteredUserTasks));
        showLoadingScreen('Deleting task...', 1000);
        setTimeout(() => location.reload(), 1000);
        return;
    }
    
    console.log('Task not found in any list');
    showModalAlert('Task not found', true);
}

// Show a modal displaying the full details of a task
function showTaskModal(task) {
    console.log('showTaskModal called', task);
    const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
    const isAuthor = currentUser.username === task.author || currentUser.email === task.author;
    const isCompleter = task.completedBy === currentUser.username || task.completedBy === currentUser.email;
    
    let actionButtons = '<div class="task-modal-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">';
    actionButtons += '<button class="task-modal-btn task-modal-close-btn" onclick="this.closest(\'.notification-modal-overlay\').remove();document.body.style.overflow=\'\'" style="padding: 8px 16px; background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600;">Close</button>';
    
    // Delete button for uncompleted tasks (author only)
    if (!task.content && isAuthor) {
        actionButtons += `<button class="task-modal-btn task-modal-delete-btn" onclick="deleteTaskFromModal('${encodeURIComponent(JSON.stringify(task))}')" style="padding: 8px 16px; background-color: #d9534f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Delete Task</button>`;
    }
    
    // Delete buttons for completed tasks
    if (task.content) {
        // Completer can delete
        if (isCompleter) {
            actionButtons += `<button class="task-modal-btn task-modal-delete-btn" onclick="deleteCompletedTaskFromModal('${encodeURIComponent(JSON.stringify(task))}')" style="padding: 8px 16px; background-color: #d9534f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Delete My Submission</button>`;
        }
        // Author can also delete
        if (isAuthor && !isCompleter) {
            actionButtons += `<button class="task-modal-btn task-modal-delete-btn" onclick="deleteCompletedTaskFromModal('${encodeURIComponent(JSON.stringify(task))}')" style="padding: 8px 16px; background-color: #d9534f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Delete Submission</button>`;
        }
    }
    
    actionButtons += '</div>';
    
    const modal = document.createElement('div');
    modal.className = 'notification-modal-overlay';
    modal.innerHTML = `
        <div class="notification-modal">
            <div class="notification-modal-header">
                <h3>${escapeHtml(task.title || 'Untitled Task')}</h3>
                <button class="notification-modal-close" onclick="this.closest('.notification-modal-overlay').remove();document.body.style.overflow=''">&times;</button>
            </div>
            <div class="notification-modal-body">
                <p><strong>Description:</strong></p>
                <p>${escapeHtml(task.description || 'No description')}</p>
                ${task.content ? `<p><strong>@${escapeHtml(task.completedBy || 'Unknown')}'s work:</strong></p><p>${escapeHtml(task.content)}</p>` : ''}
                <p><strong>Owner:</strong> ${task.author ? escapeHtml(task.author) : 'Unknown'}</p>
                ${actionButtons}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// Delete uncompleted task from modal
function deleteTaskFromModal(taskEncoded) {
    let task;
    try {
        task = JSON.parse(decodeURIComponent(taskEncoded));
    } catch (e) {
        console.error('Failed to parse task in deleteTaskFromModal', e);
        showModalAlert('Internal error', true);
        return;
    }
    // Create custom confirm modal
    const modal = document.createElement('div');
    modal.className = 'custom-alert-overlay';
    modal.innerHTML = `
        <div class="custom-alert custom-alert-danger">
            <div class="custom-alert-icon">⚠️</div>
            <div class="custom-alert-message">Are you sure you want to delete this task?</div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 24px;">
                <button onclick="this.closest('.custom-alert-overlay').remove()" style="padding: 10px 24px; background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
                <button onclick="confirmDeleteTask('${taskEncoded}')" style="padding: 10px 24px; background-color: #d9534f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmDeleteTask(taskJson) {
    try {
        const task = JSON.parse(decodeURIComponent(taskJson));
        document.querySelectorAll('.custom-alert-overlay')[0].remove();
        
        // Try backend deletion first if task has an id
        if (task.id) {
            fetch(`http://localhost:3000/tasks/${task.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            }).then(r => {
                if (r.ok) {
                    console.log('Task deleted from backend');
                    showLoadingScreen('Deleting task...', 1000);
                    setTimeout(() => location.reload(), 1000);
                    return;
                } else {
                    throw new Error('Backend delete failed');
                }
            }).catch(err => {
                console.error('Backend delete failed:', err);
                deleteTaskFromLocalStorage(task);
            });
        } else {
            deleteTaskFromLocalStorage(task);
        }
    } catch(e) {
        console.error('Error parsing task:', e);
        showModalAlert('Error deleting task', true);
    }
}

function deleteTaskFromLocalStorage(task) {
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
    const availableTasks = JSON.parse(localStorage.getItem('availableTasks') || '[]');
    
    const filteredCompleted = completedTasks.filter(t => !(t.title === task.title && t.author === task.author));
    const filteredAvailable = availableTasks.filter(t => !(t.title === task.title && t.author === task.author));
    
    if (filteredCompleted.length < completedTasks.length) {
        localStorage.setItem('completedTasks', JSON.stringify(filteredCompleted));
        console.log('Task removed from completedTasks');
        document.querySelector('.notification-modal-overlay').remove();
        document.body.style.overflow = '';
        showLoadingScreen('Deleting task...', 1000);
        setTimeout(() => location.reload(), 1000);
    } else if (filteredAvailable.length < availableTasks.length) {
        localStorage.setItem('availableTasks', JSON.stringify(filteredAvailable));
        console.log('Task removed from availableTasks');
        document.querySelector('.notification-modal-overlay').remove();
        document.body.style.overflow = '';
        showLoadingScreen('Deleting task...', 1000);
        setTimeout(() => location.reload(), 1000);
    } else {
        document.querySelector('.notification-modal-overlay').remove();
        document.body.style.overflow = '';
        showModalAlert('Task not found', true);
    }
}

// Delete completed task submission from task card button
function deleteCompletedTaskFromModalObj(task) {
    console.log('deleteCompletedTaskFromModalObj called for task:', task);
    
    // Close any open view modal to avoid double overlays
    const existingView = document.querySelector('.notification-modal-overlay');
    if (existingView) {
        existingView.remove();
        document.body.style.overflow = '';
    }

    // Create custom confirm modal
    const taskEncoded = encodeURIComponent(JSON.stringify(task));
    const modal = document.createElement('div');
    modal.className = 'custom-alert-overlay';
    modal.innerHTML = `
        <div class="custom-alert custom-alert-danger">
            <div class="custom-alert-icon">⚠️</div>
            <div class="custom-alert-message">Are you sure you want to delete this submission?</div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 24px;">
                <button onclick="this.closest('.custom-alert-overlay').remove()" style="padding: 10px 24px; background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
                <button onclick="confirmDeleteCompletedTask('${taskEncoded}')" style="padding: 10px 24px; background-color: #d9534f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Delete completed task submission from modal (expects encoded task string)
function deleteCompletedTaskFromModal(taskEncoded) {
    let task;
    try {
        task = JSON.parse(decodeURIComponent(taskEncoded));
    } catch (e) {
        console.error('Failed to parse task in deleteCompletedTaskFromModal', e);
        showModalAlert('Internal error', true);
        return;
    }
    console.log('deleteCompletedTaskFromModal called for task:', task);
    // Close any open view modal to avoid double overlays
    const existingView = document.querySelector('.notification-modal-overlay');
    if (existingView) {
        existingView.remove();
        document.body.style.overflow = '';
    }

    // Create custom confirm modal
    const modal = document.createElement('div');
    modal.className = 'custom-alert-overlay';
    modal.innerHTML = `
        <div class="custom-alert custom-alert-danger">
            <div class="custom-alert-icon">⚠️</div>
            <div class="custom-alert-message">Are you sure you want to delete this submission?</div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 24px;">
                <button onclick="this.closest('.custom-alert-overlay').remove()" style="padding: 10px 24px; background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
                <button onclick="confirmDeleteCompletedTask('${taskEncoded}')" style="padding: 10px 24px; background-color: #d9534f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmDeleteCompletedTask(taskJson) {
    try {
        const task = JSON.parse(decodeURIComponent(taskJson));
        document.querySelectorAll('.custom-alert-overlay')[0].remove();
        console.log('confirmDeleteCompletedTask invoked for task:', task);

        // Delete only from local display (completedTasks in localStorage)
        // Does NOT delete from database - only removes from the completed tasks display
        deleteCompletedTaskFromLocalStorage(task);
    } catch(e) {
        console.error('Error parsing task:', e);
        showModalAlert('Error deleting submission', true);
    }
}

function confirmRevolkeTask(taskJson) {
    try {
        const task = JSON.parse(decodeURIComponent(taskJson));
        document.querySelectorAll('.custom-alert-overlay')[0].remove();
        
        // remove from user's taken list, send back to available
        const userTasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
        const filtered = userTasks.filter(t => !(t.title === task.title && t.author === task.author));
        localStorage.setItem('userTasks', JSON.stringify(filtered));
        showLoadingScreen('Revoking task...', 1000);
        setTimeout(() => location.reload(), 1000);
    } catch(e) {
        console.error('Error revoking task:', e);
        showModalAlert('Error revoking task', true);
    }
}

function confirmMainDeleteTask(taskJson) {
    try {
        const task = JSON.parse(decodeURIComponent(taskJson));
        document.querySelectorAll('.custom-alert-overlay')[0].remove();
        
        // Try backend deletion first if task has an id
        if (task.id) {
            fetch(`http://localhost:3000/tasks/${task.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            }).then(r => {
                if (r.ok) {
                    console.log('Task deleted from backend');
                    showLoadingScreen('Deleting task...', 1000);
                    setTimeout(() => location.reload(), 1000);
                    return;
                } else {
                    throw new Error('Backend delete failed');
                }
            }).catch(err => {
                console.error('Backend delete error:', err);
                deleteFromLocalStorage(task);
            });
        } else {
            deleteFromLocalStorage(task);
        }
    } catch(e) {
        console.error('Error deleting task:', e);
        showModalAlert('Error deleting task', true);
    }
}

function deleteCompletedTaskFromLocalStorage(task) {
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
    const filtered = completedTasks.filter(t => {
        // match by id when available, otherwise by title/author/completedBy
        if (t.id && task.id) return t.id !== task.id;
        return !(t.title === task.title && t.author === task.author && t.completedBy === task.completedBy);
    });
    
    if (filtered.length < completedTasks.length) {
        localStorage.setItem('completedTasks', JSON.stringify(filtered));
        console.log('Completed task removed');
        const nm = document.querySelector('.notification-modal-overlay'); if (nm) nm.remove();
        document.body.style.overflow = '';
        showLoadingScreen('Deleting submission...', 1000);
        setTimeout(() => location.reload(), 1000);
    } else {
        const nm = document.querySelector('.notification-modal-overlay'); if (nm) nm.remove();
        document.body.style.overflow = '';
        showModalAlert('Submission not found', true);
    }
}

// Load and display friends (only accepted friends)
function loadFriends() {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    const allFriends = JSON.parse(localStorage.getItem('friends') || '[]');
    // Filter only accepted friends
    const acceptedFriends = allFriends.filter(f => f.status === 'accepted');
    const container = document.getElementById('friendsContainer');
    const noMessage = document.getElementById('noFriendsMessage');
    
    container.innerHTML = '';
    
    if (acceptedFriends.length === 0) {
        container.classList.add('hidden');
        noMessage.classList.add('show');
    } else {
        container.classList.remove('hidden');
        noMessage.classList.remove('show');
        
        acceptedFriends.forEach(friend => {
            const friendCard = document.createElement('div');
            friendCard.className = 'friend-card';
            friendCard.innerHTML = `
                <div class="friend-card-name">${escapeHtml(friend.username || friend.name || 'Unknown')}</div>
                <div class="friend-card-email">${escapeHtml(friend.email || '')}</div>
                <div class="friend-card-status">✓ Connected</div>
            `;
            container.appendChild(friendCard);
        });
    }
}

// Setup form handlers
function setupFormHandlers() {
    const createTaskForm = document.getElementById('createTaskForm');
    
    if (createTaskForm) {
        createTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('taskTitle').value.trim();
            const description = document.getElementById('taskDescription').value.trim();
            
            if (!title) {
                showModalAlert('Please enter a task title', true);
                return;
            }
            
            const user = JSON.parse(localStorage.getItem('userData') || '{}');
            
            if (!user.id) {
                showModalAlert('User not logged in. Please login again.', true);
                return;
            }
            
            const newTask = {
                userId: user.id,
                title: title,
                description: description,
                author: user.username || user.email || 'Unknown',
                isAvailable: true,
                status: 'open',
                createdAt: new Date().toISOString()
            };
            
            // Send to backend
            fetch('http://localhost:3000/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTask)
            })
            .then(r => {
                if (!r.ok) {
                    return r.json().then(err => {
                        throw new Error(err.message || 'Failed to create task');
                    });
                }
                return r.json();
            })
            .then(result => {
                console.log('Task created:', result);
                // Reset form
                createTaskForm.reset();
                showLoadingScreen('Publishing task...', 1000);
                setTimeout(() => {
                    // Switch back to dashboard overview
                    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
                    document.getElementById('dashboard-overview').classList.add('active');
                    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
                    // Reload tasks view
                    loadDashboardData();
                }, 1000);
            })
            .catch(err => {
                console.error('Error creating task:', err);
                showModalAlert('Error: ' + err.message, true);
                // Store locally if backend fails
                let tasks = JSON.parse(localStorage.getItem('userTasks') || '[]');
                tasks.push(newTask);
                localStorage.setItem('userTasks', JSON.stringify(tasks));
            });
        });
        
        // Reset button handler
        const resetBtn = createTaskForm.querySelector('[type="reset"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                createTaskForm.reset();
            });
        }
    }
}

