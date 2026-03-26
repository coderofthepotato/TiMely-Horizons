// Task management
class TaskManager {
    constructor() {
        this.tasks = storage.getTasks();
        this.categories = storage.getCategories();
        this.currentCategory = 'all';
        this.editingTaskId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCategories();
        this.renderTasks();
    }

    setupEventListeners() {
        // Add category
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.addCategory();
        });

        document.getElementById('newCategoryInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCategory();
            }
        });

        // Add task
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.addTask();
        });

        // Filter tasks
        document.getElementById('filterTasks').addEventListener('change', (e) => {
            this.filterTasks(e.target.value);
        });

        // Task modal handlers
        document.getElementById('saveTaskEditBtn').addEventListener('click', () => {
            this.saveTaskEdit();
        });

        document.getElementById('cancelTaskEditBtn').addEventListener('click', () => {
            ui.closeModalById('taskEditModal');
        });

        // Category modal handlers
        document.getElementById('saveCategoryEditBtn').addEventListener('click', () => {
            this.saveCategoryEdit();
        });

        document.getElementById('cancelCategoryEditBtn').addEventListener('click', () => {
            ui.closeModalById('categoryEditModal');
        });
    }

    addCategory() {
        const input = document.getElementById('newCategoryInput');
        const name = input.value.trim();

        if (!name) {
            ui.showNotification('Please enter a category name', 'error');
            return;
        }

        const category = {
            id: 'cat_' + Date.now(),
            name: name,
            color: ui.getRandomColor()
        };

        this.categories.push(category);
        storage.setCategories(this.categories);
        input.value = '';
        this.renderCategories();
        this.updateTaskCategorySelect();
        ui.showNotification('Category added!', 'success');
    }

    removeCategory(categoryId) {
        this.categories = this.categories.filter(c => c.id !== categoryId && c.id !== 'default');
        storage.setCategories(this.categories);
        this.renderCategories();
        this.updateTaskCategorySelect();
    }

    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            document.getElementById('editCategoryName').value = category.name;
            document.getElementById('editCategoryColor').value = category.color;
            this.editingCategoryId = categoryId;
            ui.openModal('categoryEditModal');
        }
    }

    saveCategoryEdit() {
        const categoryId = this.editingCategoryId;
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            category.name = document.getElementById('editCategoryName').value;
            category.color = document.getElementById('editCategoryColor').value;
            storage.setCategories(this.categories);
            this.renderCategories();
            this.updateTaskCategorySelect();
            ui.closeModalById('categoryEditModal');
            ui.showNotification('Category updated!', 'success');
        }
    }

    renderCategories() {
        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = '';

        this.categories.forEach(category => {
            if (category.id === 'default') return; // Don't show default category

            const li = document.createElement('li');
            li.className = `category-item ${this.currentCategory === category.id ? 'active' : ''}`;
            li.innerHTML = `
                <span>${category.name}</span>
                <div class="category-item-actions">
                    <button data-action="edit" data-category-id="${category.id}" title="Edit">✏️</button>
                    <button data-action="delete" data-category-id="${category.id}" title="Delete">🗑️</button>
                </div>
            `;

            li.addEventListener('click', (e) => {
                if (!e.target.closest('.category-item-actions')) {
                    this.selectCategory(category.id);
                }
            });

            li.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
                e.stopPropagation();
                this.editCategory(category.id);
            });

            li.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this category? Tasks will not be deleted.')) {
                    this.removeCategory(category.id);
                }
            });

            categoriesList.appendChild(li);
        });
    }

    selectCategory(categoryId) {
        this.currentCategory = categoryId;
        this.renderCategories();
        this.renderTasks();
    }

    updateTaskCategorySelect() {
        const select = document.getElementById('taskCategory');
        select.innerHTML = '';

        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const date = document.getElementById('taskDate').value;
        const time = document.getElementById('taskTime').value;
        const category = document.getElementById('taskCategory').value;
        const priority = document.getElementById('taskPriority').checked;

        if (!title) {
            ui.showNotification('Please enter a task title', 'error');
            return;
        }

        const task = {
            id: 'task_' + Date.now(),
            title: title,
            description: description,
            date: date || new Date().toISOString().split('T')[0],
            time: time || '00:00',
            category: category || 'default',
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        storage.setTasks(this.tasks);
        this.clearTaskForm();
        this.renderTasks();
        ui.showNotification('Task added!', 'success');
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        storage.setTasks(this.tasks);
        this.renderTasks();
        ui.showNotification('Task deleted!', 'info');
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            storage.setTasks(this.tasks);
            this.renderTasks();

            if (task.completed) {
                ui.showNotification('Task completed!', 'success');
                this.updateTaskStats();
            }
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('editTaskTitle').value = task.title;
            document.getElementById('editTaskDescription').value = task.description;
            document.getElementById('editTaskDate').value = task.date;
            document.getElementById('editTaskTime').value = task.time;
            document.getElementById('editTaskPriority').checked = task.priority;
            this.editingTaskId = taskId;
            ui.openModal('taskEditModal');
        }
    }

    saveTaskEdit() {
        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.title = document.getElementById('editTaskTitle').value;
            task.description = document.getElementById('editTaskDescription').value;
            task.date = document.getElementById('editTaskDate').value;
            task.time = document.getElementById('editTaskTime').value;
            task.priority = document.getElementById('editTaskPriority').checked;
            
            storage.setTasks(this.tasks);
            this.renderTasks();
            ui.closeModalById('taskEditModal');
            ui.showNotification('Task updated!', 'success');
        }
    }

    clearTaskForm() {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskDate').value = '';
        document.getElementById('taskTime').value = '';
        document.getElementById('taskPriority').checked = false;
    }

    filterTasks(filter) {
        let filtered = this.tasks;

        switch (filter) {
            case 'pending':
                filtered = this.tasks.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = this.tasks.filter(t => t.completed);
                break;
            case 'priority':
                filtered = this.tasks.filter(t => t.priority);
                break;
        }

        this.renderFilteredTasks(filtered);
    }

    renderFilteredTasks(tasks) {
        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = '';

        if (tasks.length === 0) {
            tasksList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No tasks to display</div>';
            return;
        }

        tasks.forEach(task => {
            this.renderTaskItem(task, tasksList);
        });
    }

    renderTasks() {
        let filtered = this.tasks;

        if (this.currentCategory !== 'all') {
            filtered = this.tasks.filter(t => t.category === this.currentCategory);
        }

        // Sort by priority and date
        filtered.sort((a, b) => {
            if (a.priority !== b.priority) return b.priority ? 1 : -1;
            return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
        });

        this.renderFilteredTasks(filtered);
    }

    renderTaskItem(task, container) {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''} ${task.priority ? 'priority' : ''}`;

        const category = this.categories.find(c => c.id === task.category);
        const categoryColor = category ? category.color : '#6c63ff';

        div.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-meta">
                    <span class="task-meta-item" style="color: ${categoryColor};">●</span>
                    <span class="task-meta-item">${category ? category.name : 'General'}</span>
                    <span class="task-meta-item">📅 ${ui.formatDate(task.date)}</span>
                    <span class="task-meta-item">🕐 ${task.time}</span>
                    ${task.priority ? '<span class="task-meta-item">⭐ Priority</span>' : ''}
                </div>
            </div>
            <div class="task-actions">
                <button data-action="edit" data-task-id="${task.id}" title="Edit">✏️</button>
                <button data-action="delete" data-task-id="${task.id}" title="Delete">🗑️</button>
            </div>
        `;

        const checkbox = div.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => {
            this.toggleTask(task.id);
        });

        div.querySelector('[data-action="edit"]').addEventListener('click', () => {
            this.editTask(task.id);
        });

        div.querySelector('[data-action="delete"]').addEventListener('click', () => {
            if (confirm('Delete this task?')) {
                this.deleteTask(task.id);
            }
        });

        container.appendChild(div);
    }

    updateTaskStats() {
        const stats = storage.getStudyStats();
        stats.tasksCompleted = this.tasks.filter(t => t.completed).length;
        storage.updateStudyStats(stats);
        if (window.profileManager) {
            window.profileManager.updateStats();
        }
    }
}

// Initialize task manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.taskManager = new TaskManager();
    });
} else {
    window.taskManager = new TaskManager();
}
