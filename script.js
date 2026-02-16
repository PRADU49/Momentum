let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let myChart = null;
let pendingAction = null;

// Render on page load (Fix for localStorage display issue)
document.addEventListener("DOMContentLoaded", function () {
    renderApp();
});

// This function added task and save data
function addTask(e) {
    e.preventDefault();
    const newTask = {
        id: Date.now(),
        name: document.getElementById('taskName').value,
        date: document.getElementById('taskDate').value,
        priority: document.getElementById('taskPriority').value,
        completed: false,
        createdAt: new Date().toLocaleDateString() + ' ' +
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    tasks.push(newTask);
    saveAndRender();
    e.target.reset();
}

// This function for show status of task
function toggleStatus(id) {
    tasks = tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
    );
    saveAndRender();
}

// Custom Modal Logic
function openModal(title, msg, onConfirm) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMsg').innerText = msg;
    document.getElementById('customModal').style.display = 'flex';
    pendingAction = onConfirm;
}

function closeModal() {
    document.getElementById('customModal').style.display = 'none';
}

document.getElementById('confirmActionBtn').onclick = () => {
    if (pendingAction) pendingAction();
    closeModal();
};

function confirmDelete(id) {
    openModal("Delete Task?", "This action cannot be undone.", () => {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRender();
    });
}

function confirmClearAll() {
    if (tasks.length === 0) return;
    openModal("Clear All Tasks?", "Are you sure you want to remove everything?", () => {
        tasks = [];
        saveAndRender();
    });
}

function saveAndRender() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderApp();
}

// This function run whole app
function renderApp() {
    const container = document.getElementById('taskListContainer');
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const today = new Date().toISOString().split('T')[0];

    const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };

    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;

        const aOverdue = !a.completed && a.date < today;
        const bOverdue = !b.completed && b.date < today;
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

        return priorityMap[b.priority] - priorityMap[a.priority];
    });

    const filteredTasks = sortedTasks.filter(t =>
        t.name.toLowerCase().includes(searchTerm)
    );

    container.innerHTML = filteredTasks.length === 0
        ? `<div class="empty-state">No tasks found. Add your first task to get started 🚀</div>`
        : '';

    filteredTasks.forEach(task => {
        const isOverdue = !task.completed && task.date < today;
        const div = document.createElement('div');

        div.className = `task-item priority-${task.priority.toLowerCase()}`;
        if (isOverdue) div.classList.add('overdue');

        const completedClass = task.completed ? 'task-completed' : '';

        div.innerHTML = `
            <div class="task-info">
                <h4 class="${completedClass}">
                    ${task.name}
                    <span class="priority-dot" style="background:${getPriorityColor(task.priority)}"></span>
                </h4>
                <div class="task-meta">
                    <span><i class="far fa-calendar"></i> ${task.date} ${isOverdue ? '<b style="color:var(--danger)">!</b>' : ''}</span>
                    <span><i class="far fa-clock"></i> ${task.createdAt}</span>
                </div>
            </div>
            <div class="actions">
                <button class="action-btn btn-complete" onclick="toggleStatus(${task.id})" title="Toggle Status">
                    <i class="fas ${task.completed ? 'fa-rotate-left' : 'fa-circle-check'}"></i>
                </button>
                <button class="action-btn btn-delete" onclick="confirmDelete(${task.id})" title="Delete Task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });

    updateUIStats(today);
}

// This function for showing priority color
function getPriorityColor(p) {
    return p === 'High'
        ? 'var(--danger)'
        : p === 'Medium'
            ? 'var(--warning)'
            : 'var(--success)';
}

// This function updates total, completed, pending, overdue
function updateUIStats(today) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const overdue = tasks.filter(t => !t.completed && t.date < today).length;
    const pending = total - completed;

    document.getElementById('totalCount').innerText = total;
    document.getElementById('completedCount').innerText = completed;
    document.getElementById('pendingCount').innerText = pending;
    document.getElementById('overdueCount').innerText = overdue;

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById('progressBar').style.width = percent + '%';
    document.getElementById('progressPercent').innerText = percent + '%';

    const motivation = document.getElementById('motivationText');
    if (percent < 40) motivation.innerText = "Let’s get started!";
    else if (percent < 70) motivation.innerText = "You’re making progress!";
    else motivation.innerText = "Great job! Keep going!";

    renderChart(completed, pending, overdue);
}

// This function shows data in chart
function renderChart(completed, pending, overdue) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Done', 'Pending', 'Overdue'],
            datasets: [{
                data: [completed, pending, overdue],
                backgroundColor: ['#10b981', '#6366f1', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            plugins: { legend: { position: 'bottom' } },
            cutout: '70%'
        }
    });
} 