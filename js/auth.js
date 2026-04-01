// js/auth.js
// Centralized Auth & Personalization Controller for Vanguard AI Prep

const Auth = {
    // 1. Session Storage Keys
    USER_KEY: 'vanguard_user',

    // 2. Get Current User
    getUser() {
        const data = localStorage.getItem(this.USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    // 3. Login Simulation
    login(name) {
        // Find existing or mock one
        let user = this.getUser();
        if (!user) {
            // Force onboarding if they try to login without a profile
            return false; 
        }
        return true;
    },

    // 4. Signup & Onboarding Flow
    signup(userData) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
        return true;
    },

    // 5. Update Preferences (e.g. Last Module Opened)
    updatePreference(key, value) {
        let user = this.getUser();
        if (user) {
            user[key] = value;
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
    },

    // 6. Logout
    logout() {
        localStorage.removeItem(this.USER_KEY);
        window.location.href = 'index.html';
    },

    // 7. Route Guard (Redirects to index if not logged in)
    requireAuth() {
        if (!this.getUser()) {
            window.location.href = 'index.html?auth=required';
        }
    },

    // 8. Redirect Logic with Loading state
    redirectWithLoading(targetUrl, loaderContainerId, statusTextId, callback) {
        const loader = document.getElementById(loaderContainerId);
        const statusText = document.getElementById(statusTextId);
        
        if (loader) {
            loader.style.display = 'flex';
        }
        if (statusText) {
            statusText.textContent = "Setting up your dashboard...";
        }

        // Simulate network latency & DB setup
        setTimeout(() => {
            if(callback) callback();
            window.location.href = targetUrl;
        }, 1500);
    },

    // 9. Recommended Module Logic
    getRecommendation(user) {
        if (!user) return null;
        if (user.goal === 'SSB focus') {
            return {
                id: 'module-ssb',
                title: 'SSB Simulation',
                reason: 'Based on your focus on SSB evaluation.'
            };
        } else if (user.level === 'Beginner') {
            return {
                id: 'module-plan',
                title: 'Study Planner',
                reason: 'Recommended for beginners to establish a timeline.'
            };
        } else if (user.exam === 'CDS' || user.exam === 'NDA') {
            return {
                id: 'module-mcq',
                title: 'MCQ Generator',
                reason: 'Crucial for passing written topography for ' + user.exam + '.'
            };
        } else {
            return {
                id: 'module-ca',
                title: 'Current Affairs',
                reason: 'Daily routine recommendation.'
            };
        }
    }
};

window.VanguardAuth = Auth;
