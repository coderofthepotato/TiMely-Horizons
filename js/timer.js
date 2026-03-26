// Timer management (Pomodoro Timer)
class TimerManager {
    constructor() {
        this.settings = storage.getTimerSettings();
        this.sessions = storage.getTimerSessions();
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = this.settings.workDuration * 60;
        this.timerInterval = null;
        this.sessionStartTime = null;
        this.isWorkSession = true;
        this.sessionCount = 0;
        this.init();
    }

    init() {
        this.updateDisplay();
        this.setupEventListeners();
        this.renderSessions();
    }

    setupEventListeners() {
        document.getElementById('timerStartBtn').addEventListener('click', () => this.start());
        document.getElementById('timerPauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('timerResetBtn').addEventListener('click', () => this.reset());
        document.getElementById('applyTimerSettingsBtn').addEventListener('click', () => this.applySettings());
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.sessionStartTime = Date.now();

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;

            if (this.timeRemaining <= 0) {
                this.completeSession();
            } else {
                this.updateDisplay();
                this.updateProgress();
            }
        }, 1000);

        this.updateButtonStates();
    }

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.timerInterval);
        this.updateButtonStates();
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        this.timeRemaining = this.isWorkSession ? this.settings.workDuration * 60 : 
                             (this.sessionCount > 0 && this.sessionCount % this.settings.sessionsUntilLongBreak === 0 ? 
                              this.settings.longBreakDuration * 60 : this.settings.breakDuration * 60);
        this.updateDisplay();
        this.updateProgress();
        this.updateButtonStates();
    }

    completeSession() {
        clearInterval(this.timerInterval);
        this.isRunning = false;

        const elapsedTime = this.isWorkSession ? this.settings.workDuration : 
                           (this.sessionCount > 0 && this.sessionCount % this.settings.sessionsUntilLongBreak === 0 ? 
                            this.settings.longBreakDuration : this.settings.breakDuration);

        // Save session
        const session = {
            id: 'session_' + Date.now(),
            type: this.isWorkSession ? 'work' : 'break',
            duration: elapsedTime,
            completedAt: new Date().toISOString()
        };

        this.sessions.push(session);
        storage.setTimerSessions(this.sessions);

        // Update stats if work session
        if (this.isWorkSession) {
            const stats = storage.getStudyStats();
            stats.totalStudyTime += elapsedTime;
            storage.updateStudyStats(stats);
            if (window.profileManager) {
                window.profileManager.updateStats();
            }
        }

        // Play notification
        this.playNotification();

        // Switch session type
        this.isWorkSession = !this.isWorkSession;
        if (this.isWorkSession) {
            this.sessionCount++;
        }

        // Set next timer duration
        this.timeRemaining = this.isWorkSession ? this.settings.workDuration * 60 : 
                            (this.sessionCount > 0 && this.sessionCount % this.settings.sessionsUntilLongBreak === 0 ? 
                             this.settings.longBreakDuration * 60 : this.settings.breakDuration * 60);

        this.updateDisplay();
        this.updateProgress();
        this.renderSessions();

        const message = this.isWorkSession ? 'Break time is over! Time to work.' : 'Work session complete! Time for a break.';
        ui.showNotification(message, 'success');
    }

    applySettings() {
        const workDuration = parseInt(document.getElementById('workDuration').value);
        const breakDuration = parseInt(document.getElementById('breakDuration').value);
        const longBreakDuration = parseInt(document.getElementById('longBreakDuration').value);

        if (workDuration < 1 || breakDuration < 1 || longBreakDuration < 1) {
            ui.showNotification('Invalid settings', 'error');
            return;
        }

        this.settings.workDuration = workDuration;
        this.settings.breakDuration = breakDuration;
        this.settings.longBreakDuration = longBreakDuration;
        storage.setTimerSettings(this.settings);

        this.reset();
        ui.showNotification('Timer settings updated!', 'success');
    }

    updateDisplay() {
        const mins = Math.floor(this.timeRemaining / 60);
        const secs = this.timeRemaining % 60;
        const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        document.getElementById('timerDuration').textContent = display;
        document.getElementById('timerLabel').textContent = this.isWorkSession ? 'Work' : 'Break';

        // Update document title
        document.title = `${display} - tiMely Horizons`;
    }

    updateProgress() {
        const totalSeconds = this.isWorkSession ? this.settings.workDuration * 60 : 
                            (this.sessionCount > 0 && this.sessionCount % this.settings.sessionsUntilLongBreak === 0 ? 
                             this.settings.longBreakDuration * 60 : this.settings.breakDuration * 60);
        const progress = (totalSeconds - this.timeRemaining) / totalSeconds;
        const circumference = 2 * Math.PI * 95; // radius = 95
        const dashoffset = circumference * (1 - progress);

        const circle = document.querySelector('.timer-progress');
        if (circle) {
            circle.style.strokeDashoffset = dashoffset;
        }
    }

    updateButtonStates() {
        const startBtn = document.getElementById('timerStartBtn');
        const pauseBtn = document.getElementById('timerPauseBtn');

        if (this.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = !this.isPaused;
        }
    }

    renderSessions() {
        const sessionsList = document.getElementById('timerSessions');
        sessionsList.innerHTML = '';

        // Get today's sessions
        const today = new Date().toDateString();
        const todaySessions = this.sessions.filter(s => {
            return new Date(s.completedAt).toDateString() === today;
        });

        if (todaySessions.length === 0) {
            sessionsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No sessions yet today</p>';
            return;
        }

        todaySessions.forEach(session => {
            const div = document.createElement('div');
            div.className = 'session-item';
            div.innerHTML = `
                <span>${session.type === 'work' ? '📚' : '☕'} ${session.type === 'work' ? 'Work' : 'Break'}</span>
                <span class="session-time">${session.duration} min at ${new Date(session.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            `;
            sessionsList.appendChild(div);
        });
    }

    playNotification() {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
}

// Initialize timer manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.timerManager = new TimerManager();
    });
} else {
    window.timerManager = new TimerManager();
}
