// The Weekly Kanban - JavaScript Implementation
class WeeklyKanban {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('weeklyKanbanTasks')) || [];
        this.lists = JSON.parse(localStorage.getItem('weeklyKanbanLists')) || [
            { id: 'my-day', name: 'My Day', icon: '☀️', type: 'smart' },
            { id: 'important', name: 'Important', icon: '⭐', type: 'smart' },
            { id: 'planned', name: 'Planned', icon: '📅', type: 'smart' },
            { id: 'assigned', name: 'Assigned to me', icon: '👤', type: 'smart' },
            { id: 'tasks', name: 'Tasks', icon: '📋', type: 'default' },
            { id: 'getting-started', name: 'Getting started', icon: '🔥', type: 'custom' },
            { id: 'groceries', name: 'Groceries', icon: '🛒', type: 'custom' },
            { id: 'untitled', name: 'Untitled list', icon: '📝', type: 'custom' }
        ];
        this.currentView = 'my-day';
        this.currentDate = new Date();
        
        this.init();
    }

    init() {
        this.updateDate();
        this.renderNavigation();
        this.renderTasks();
        this.bindEvents();
        this.checkForRollover();
        
        // Auto-save every 30 seconds
        setInterval(() => this.saveData(), 30000);
    }

    // Date and rollover management
    updateDate() {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = this.currentDate.toLocaleDateString('en-US', options);
        const dateElement = document.querySelector('.content-date');
        if (dateElement) {
            dateElement.textContent = dateString;
        }
    }

    checkForRollover() {
        const lastDate = localStorage.getItem('weeklyKanbanLastDate');
        const today = this.currentDate.toDateString();
        
        if (lastDate && lastDate !== today) {
            this.performAutoRollover();
        }
        
        localStorage.setItem('weeklyKanbanLastDate', today);
    }

    performAutoRollover() {
        // Find incomplete tasks from "My Day" and carry them forward
        this.tasks.forEach(task => {
            if (task.listId === 'my-day' && !task.completed && !task.rolledOver) {
                task.rolledOver = true;
                task.addedToMyDay = new Date().toISOString();
            }
        });
        this.saveData();
    }

    // Task management
    createTask(title, listId = 'tasks') {
        const task = {
            id: Date.now().toString(),
            title: title.trim(),
            completed: false,
            important: false,
            listId: listId,
            createdAt: new Date().toISOString(),
            addedToMyDay: listId === 'my-day' ? new Date().toISOString() : null,
            rolledOver: false
        };
        
        this.tasks.unshift(task);
        this.saveData();
        return task;
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveData();
            this.renderTasks();
        }
    }

    toggleImportant(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.important = !task.important;
            this.saveData();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData();
        this.renderTasks();
    }

    // List management
    createList(name) {
        const list = {
            id: Date.now().toString(),
            name: name.trim(),
            icon: '📝',
            type: 'custom'
        };
        
        this.lists.push(list);
        this.saveData();
        this.renderNavigation();
        return list;
    }

    // Filtering and display
    getFilteredTasks() {
        const today = new Date().toDateString();
        
        switch (this.currentView) {
            case 'my-day':
                return this.tasks.filter(task => 
                    task.listId === 'my-day' || 
                    (task.addedToMyDay && new Date(task.addedToMyDay).toDateString() === today)
                );
            case 'important':
                return this.tasks.filter(task => task.important);
            case 'planned':
                return this.tasks.filter(task => task.dueDate);
            case 'assigned':
                return this.tasks.filter(task => task.assignedTo);
            default:
                return this.tasks.filter(task => task.listId === this.currentView);
        }
    }

    getTaskCount(listId) {
        return this.getFilteredTasks().filter(task => {
            if (listId === 'my-day') return task.listId === 'my-day' || task.addedToMyDay;
            if (listId === 'important') return task.important;
            if (listId === 'planned') return task.dueDate;
            if (listId === 'assigned') return task.assignedTo;
            return task.listId === listId;
        }).length;
    }

    // UI Rendering
    renderNavigation() {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        navMenu.innerHTML = this.lists.map(list => {
            const count = this.getTaskCount(list.id);
            const isActive = this.currentView === list.id;
            
            return `
                <div class="nav-item ${isActive ? 'active' : ''}" data-list-id="${list.id}">
                    <div class="nav-icon">${list.icon}</div>
                    <div class="nav-label">${list.name}</div>
                    ${count > 0 ? `<div class="nav-count">${count}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    renderTasks() {
        const tasksContainer = document.querySelector('.tasks-container');
        if (!tasksContainer) return;

        const filteredTasks = this.getFilteredTasks();
        const currentList = this.lists.find(l => l.id === this.currentView);
        
        // Update header title
        const contentTitle = document.querySelector('.content-title');
        if (contentTitle && currentList) {
            contentTitle.textContent = currentList.name;
        }

        const tasksHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title ${task.completed ? 'line-through' : ''}">${this.escapeHtml(task.title)}</div>
                    <div class="task-category">${this.getTaskCategory(task)}</div>
                </div>
                <div class="task-star ${task.important ? 'starred' : ''}" data-task-id="${task.id}">
                    ${task.important ? '★' : '☆'}
                </div>
            </div>
        `).join('');

        tasksContainer.innerHTML = tasksHTML + `
            <div class="add-task-container">
                <button class="add-task-btn" id="addTaskBtn">
                    <div class="add-icon">+</div>
                    Add a task
                </button>
                <div class="add-task-input-container" id="addTaskInputContainer" style="display: none;">
                    <input type="text" class="add-task-input" id="addTaskInput" placeholder="Add a task">
                    <div class="add-task-buttons">
                        <button class="add-task-save" id="addTaskSave">Add</button>
                        <button class="add-task-cancel" id="addTaskCancel">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        this.renderNavigation(); // Update counts
    }

    getTaskCategory(task) {
        const list = this.lists.find(l => l.id === task.listId);
        return list ? list.name : 'Tasks';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event handling
    bindEvents() {
        // Navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-item')) {
                const listId = e.target.closest('.nav-item').dataset.listId;
                this.switchView(listId);
            }
        });

        // Task interactions
        document.addEventListener('click', (e) => {
            const taskId = e.target.dataset.taskId;
            
            if (e.target.classList.contains('task-checkbox')) {
                this.toggleTask(taskId);
            } else if (e.target.classList.contains('task-star')) {
                this.toggleImportant(taskId);
            }
        });

        // Add task functionality
        document.addEventListener('click', (e) => {
            if (e.target.closest('#addTaskBtn')) {
                this.showAddTaskInput();
            } else if (e.target.id === 'addTaskSave') {
                this.addTaskFromInput();
            } else if (e.target.id === 'addTaskCancel') {
                this.hideAddTaskInput();
            }
        });

        // Enter key for adding tasks
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.id === 'addTaskInput') {
                this.addTaskFromInput();
            } else if (e.key === 'Escape' && e.target.id === 'addTaskInput') {
                this.hideAddTaskInput();
            }
        });

        // New list functionality
        document.addEventListener('click', (e) => {
            if (e.target.closest('.new-list-btn')) {
                this.showNewListDialog();
            }
        });

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    }

    switchView(listId) {
        this.currentView = listId;
        this.renderTasks();
    }

    showAddTaskInput() {
        const btn = document.getElementById('addTaskBtn');
        const container = document.getElementById('addTaskInputContainer');
        const input = document.getElementById('addTaskInput');
        
        if (btn && container && input) {
            btn.style.display = 'none';
            container.style.display = 'block';
            input.focus();
        }
    }

    hideAddTaskInput() {
        const btn = document.getElementById('addTaskBtn');
        const container = document.getElementById('addTaskInputContainer');
        const input = document.getElementById('addTaskInput');
        
        if (btn && container && input) {
            btn.style.display = 'flex';
            container.style.display = 'none';
            input.value = '';
        }
    }

    addTaskFromInput() {
        const input = document.getElementById('addTaskInput');
        if (input && input.value.trim()) {
            this.createTask(input.value, this.currentView);
            this.renderTasks();
            this.hideAddTaskInput();
        }
    }

    showNewListDialog() {
        const name = prompt('Enter list name:');
        if (name && name.trim()) {
            this.createList(name);
        }
    }

    handleSearch(query) {
        // Implement search functionality
        const filteredTasks = this.tasks.filter(task => 
            task.title.toLowerCase().includes(query.toLowerCase())
        );
        // You can enhance this to show search results
    }

    // Data persistence
    saveData() {
        localStorage.setItem('weeklyKanbanTasks', JSON.stringify(this.tasks));
        localStorage.setItem('weeklyKanbanLists', JSON.stringify(this.lists));
    }

    // Import/Export functionality
    exportData() {
        const data = {
            tasks: this.tasks,
            lists: this.lists,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'weekly-kanban-backup.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.tasks && data.lists) {
                this.tasks = data.tasks;
                this.lists = data.lists;
                this.saveData();
                this.renderNavigation();
                this.renderTasks();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Invalid data format!');
        }
    }
}

// Additional CSS for new functionality
const additionalStyles = `
    .task-item.completed {
        opacity: 0.6;
    }
    
    .task-checkbox.checked {
        background: #0078d4;
        border-color: #0078d4;
        color: white;
    }
    
    .task-star.starred {
        color: #ffd700;
    }
    
    .line-through {
        text-decoration: line-through;
    }
    
    .add-task-input-container {
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        border-radius: 8px;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .add-task-input {
        width: 100%;
        background: transparent;
        border: none;
        color: white;
        font-size: 14px;
        padding: 8px 0;
        outline: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        margin-bottom: 12px;
    }
    
    .add-task-input::placeholder {
        color: rgba(255, 255, 255, 0.5);
    }
    
    .add-task-buttons {
        display: flex;
        gap: 8px;
    }
    
    .add-task-save, .add-task-cancel {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .add-task-save {
        background: #0078d4;
        color: white;
    }
    
    .add-task-save:hover {
        background: #106ebe;
    }
    
    .add-task-cancel {
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .add-task-cancel:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;

// Add the additional styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.weeklyKanban = new WeeklyKanban();
});

// Global functions for debugging/testing
window.exportKanbanData = () => window.weeklyKanban.exportData();
window.clearKanbanData = () => {
    localStorage.removeItem('weeklyKanbanTasks');
    localStorage.removeItem('weeklyKanbanLists');
    localStorage.removeItem('weeklyKanbanLastDate');
    location.reload();
};