// Calendar management
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCalendar();
        this.renderSchedule();
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.previousMonth();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.nextMonth();
        });
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Clear previous days
        const daysContainer = document.getElementById('calendarDays');
        daysContainer.innerHTML = '';

        // Add previous month's days
        for (let i = firstDay - 1; i >= 0; i--) {
            const btn = document.createElement('button');
            btn.className = 'day-btn other-month';
            btn.textContent = daysInPrevMonth - i;
            btn.disabled = true;
            daysContainer.appendChild(btn);
        }

        // Add current month's days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const btn = document.createElement('button');
            btn.className = 'day-btn';
            btn.textContent = day;

            const date = new Date(year, month, day);

            // Mark today
            if (date.toDateString() === today.toDateString()) {
                btn.classList.add('today');
            }

            // Check if has events
            if (this.hasTasksOnDate(date)) {
                btn.classList.add('has-events');
            }

            // Select date
            btn.addEventListener('click', () => {
                this.selectDate(date);
            });

            daysContainer.appendChild(btn);
        }

        // Add next month's days
        const totalCells = daysContainer.children.length;
        const remainingCells = 42 - totalCells; // 6 rows * 7 days
        for (let i = 1; i <= remainingCells; i++) {
            const btn = document.createElement('button');
            btn.className = 'day-btn other-month';
            btn.textContent = i;
            btn.disabled = true;
            daysContainer.appendChild(btn);
        }

        // Mark selected date
        this.markSelectedDate();
    }

    selectDate(date) {
        this.selectedDate = date;
        this.markSelectedDate();
        this.renderSchedule();
    }

    markSelectedDate() {
        const dayBtns = document.querySelectorAll('.day-btn:not(.other-month)');
        dayBtns.forEach(btn => {
            btn.classList.remove('selected');
            const dayNum = parseInt(btn.textContent);
            if (dayNum === this.selectedDate.getDate() && 
                this.selectedDate.getMonth() === this.currentDate.getMonth() &&
                this.selectedDate.getFullYear() === this.currentDate.getFullYear()) {
                btn.classList.add('selected');
            }
        });
    }

    hasTasksOnDate(date) {
        if (!window.taskManager) return false;
        const dateStr = date.toISOString().split('T')[0];
        return window.taskManager.tasks.some(t => t.date === dateStr);
    }

    renderSchedule() {
        const dateStr = this.selectedDate.toISOString().split('T')[0];
        const dayName = this.selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
        });

        document.getElementById('selectedDateLabel').textContent = `${dayName}'s Schedule`;

        const scheduleList = document.getElementById('daySchedule');
        scheduleList.innerHTML = '';

        if (!window.taskManager) {
            scheduleList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 1rem;">No tasks yet</div>';
            return;
        }

        const tasksOnDate = window.taskManager.tasks
            .filter(t => t.date === dateStr)
            .sort((a, b) => {
                const timeA = a.time.split(':').map(Number);
                const timeB = b.time.split(':').map(Number);
                return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
            });

        if (tasksOnDate.length === 0) {
            scheduleList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 1rem;">No tasks scheduled for this day</div>';
            return;
        }

        tasksOnDate.forEach(task => {
            const div = document.createElement('div');
            div.className = 'schedule-item';
            div.innerHTML = `
                <span class="schedule-time">${task.time}</span>
                <span class="schedule-title">${task.title}</span>
            `;
            scheduleList.appendChild(div);
        });
    }
}

// Initialize calendar manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.calendarManager = new CalendarManager();
    });
} else {
    window.calendarManager = new CalendarManager();
}
