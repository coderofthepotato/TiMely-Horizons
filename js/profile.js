// Profile management
class ProfileManager {
    constructor() {
        this.profile = storage.getProfile();
        this.init();
    }

    init() {
        this.loadProfile();
        this.setupEventListeners();
        this.updateStats();
    }

    loadProfile() {
        // Load profile data
        document.getElementById('profileName').textContent = this.profile.name;
        document.getElementById('profileTitle').textContent = this.profile.title;
        document.getElementById('profileBio').textContent = this.profile.bio;

        // Load avatar
        if (this.profile.avatar) {
            document.getElementById('avatarImage').src = this.profile.avatar;
        }

        // Load goals
        this.renderGoals();
    }

    setupEventListeners() {
        // Avatar upload
        document.getElementById('avatarEditBtn').addEventListener('click', () => {
            document.getElementById('avatarInput').click();
        });

        document.getElementById('avatarInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadAvatar(file);
            }
        });

        // Save profile
        document.getElementById('saveProfileBtn').addEventListener('click', () => {
            this.saveProfile();
        });

        // Reset profile
        document.getElementById('resetProfileBtn').addEventListener('click', () => {
            if (confirm('Are you sure? This will reset all profile changes.')) {
                this.resetProfile();
            }
        });

        // Add goal
        document.getElementById('addGoalBtn').addEventListener('click', () => {
            this.addGoal();
        });

        // Goal input Enter key
        document.getElementById('goalInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addGoal();
            }
        });

        // Editable fields
        const editableFields = ['profileName', 'profileTitle', 'profileBio'];
        editableFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.addEventListener('blur', () => {
                this.profile[fieldId === 'profileName' ? 'name' : fieldId === 'profileTitle' ? 'title' : 'bio'] = field.textContent;
            });
        });
    }

    uploadAvatar(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            this.profile.avatar = base64;
            document.getElementById('avatarImage').src = base64;
            storage.setProfile(this.profile);
            ui.showNotification('Avatar updated!', 'success');
        };
        reader.readAsDataURL(file);
    }

    saveProfile() {
        // Update profile with current values
        this.profile.name = document.getElementById('profileName').textContent;
        this.profile.title = document.getElementById('profileTitle').textContent;
        this.profile.bio = document.getElementById('profileBio').textContent;

        storage.setProfile(this.profile);
        ui.showNotification('Profile saved successfully!', 'success');
    }

    resetProfile() {
        this.profile = {
            name: 'User Name',
            title: 'Student',
            bio: 'Add your bio here...',
            avatar: null,
            goals: []
        };
        storage.setProfile(this.profile);
        this.loadProfile();
        ui.showNotification('Profile reset!', 'info');
    }

    addGoal() {
        const input = document.getElementById('goalInput');
        const goalText = input.value.trim();

        if (!goalText) {
            ui.showNotification('Please enter a goal', 'error');
            return;
        }

        const goal = {
            id: 'goal_' + Date.now(),
            text: goalText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.profile.goals.push(goal);
        storage.setProfile(this.profile);
        input.value = '';
        this.renderGoals();
        ui.showNotification('Goal added!', 'success');
    }

    removeGoal(goalId) {
        this.profile.goals = this.profile.goals.filter(g => g.id !== goalId);
        storage.setProfile(this.profile);
        this.renderGoals();
        ui.showNotification('Goal removed!', 'info');
    }

    renderGoals() {
        const goalsList = document.getElementById('goalsList');
        goalsList.innerHTML = '';

        if (this.profile.goals.length === 0) {
            goalsList.innerHTML = '<li style="color: var(--text-tertiary); text-align: center; padding: 1rem;">No goals yet. Add one!</li>';
            return;
        }

        this.profile.goals.forEach(goal => {
            const li = document.createElement('li');
            li.className = 'goal-item';
            li.innerHTML = `
                <span>${goal.text}</span>
                <button data-goal-id="${goal.id}">×</button>
            `;
            li.querySelector('button').addEventListener('click', () => {
                this.removeGoal(goal.id);
            });
            goalsList.appendChild(li);
        });
    }

    updateStats() {
        const stats = storage.getStudyStats();
        document.getElementById('tasksCompletedCount').textContent = stats.tasksCompleted;
        document.getElementById('studyStreakCount').textContent = stats.studyStreak;
        document.getElementById('totalStudyTimeCount').textContent = (stats.totalStudyTime / 60).toFixed(1);
    }

    getProfile() {
        return this.profile;
    }
}

// Initialize profile manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.profileManager = new ProfileManager();
    });
} else {
    window.profileManager = new ProfileManager();
}
