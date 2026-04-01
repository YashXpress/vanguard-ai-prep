// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
            const spans = mobileMenuBtn.querySelectorAll('span');
            if (mobileNav.classList.contains('open')) {
                spans[0].style.transform = 'translateY(8px) rotate(45deg)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'translateY(-8px) rotate(-45deg)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // 2. Theme Toggle Logic
    const themeBtn = document.getElementById('theme-toggle');
    
    // Check local storage or default to dark
    const storedTheme = localStorage.getItem('vanguard_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', storedTheme);

    if (themeBtn) {
        // Init icon based on theme
        themeBtn.innerHTML = storedTheme === 'dark' ? '☀️' : '🌙';

        themeBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const target = current === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', target);
            localStorage.setItem('vanguard_theme', target);
            
            themeBtn.innerHTML = target === 'dark' ? '☀️' : '🌙';
        });
    }

    // 3. Fade-In Intersection Observer (Smooth Scroll Animations)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    window.VanguardObserver = observer;

    const sections = document.querySelectorAll('.fade-in-section, .slide-in-left, .slide-in-right');
    sections.forEach(section => {
        observer.observe(section);
    });

    // 4. Dynamic Navbar Render
    const renderDynamicNavbar = () => {
        const navContainer = document.getElementById('nav-container');
        const mobileNavContainer = document.getElementById('mobile-nav');
        if(!navContainer) return; // Only needed if nav-container exists
        
        let user = null;
        if(window.VanguardAuth) user = window.VanguardAuth.getUser();
        
        // Define paths based on relative position. They're all in root.
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        
        const act = (page) => currentPath === page ? 'active' : '';

        // Desktop HTML
        let desktopHTML = `
            <nav class="nav-links">
                <a href="index.html" class="${act('index.html')}">Home</a>
                ${user ? `<a href="features.html" class="${act('features.html')}">Dashboard</a>` : `<a href="features.html" class="${act('features.html')}">Features</a>`}
                <a href="about.html" class="${act('about.html')}">About</a>
            </nav>
            <div class="flex-center" style="gap: 1rem;">
                <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle Dark/Light Mode"></button>
                ${!user ? `
                    <button onclick="openAuthModal('login')" class="btn btn-outline btn-sm">Login</button>
                    <button onclick="openAuthModal('signup')" class="btn btn-primary btn-sm">Sign Up</button>
                ` : `
                    <button onclick="window.VanguardAuth.logout()" class="btn btn-outline btn-sm">Logout</button>
                `}
                <button class="menu-toggle" aria-label="Toggle menu" id="mobile-menu-btn">
                    <span></span><span></span><span></span>
                </button>
            </div>
        `;
        
        // Mobile HTML
        let mobileHTML = `
            <a href="index.html" class="${act('index.html')}">Home</a>
            ${user ? `<a href="features.html" class="${act('features.html')}">Dashboard</a>` : `<a href="features.html" class="${act('features.html')}">Features</a>`}
            <a href="about.html" class="${act('about.html')}">About</a>
            <a href="feedback.html" class="${act('feedback.html')}">Feedback</a>
            ${!user ? `
                <button onclick="openAuthModal('login')" class="btn btn-outline mt-sm text-center">Login</button>
            ` : `
                <button onclick="window.VanguardAuth.logout()" class="btn btn-outline mt-sm text-center">Logout</button>
            `}
        `;

        navContainer.innerHTML = desktopHTML;
        if(mobileNavContainer) {
            mobileNavContainer.innerHTML = mobileHTML;
        }

        // Re-attach event listeners for dynamically added buttons
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn && mobileNavContainer) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileNavContainer.classList.toggle('open');
                const spans = mobileMenuBtn.querySelectorAll('span');
                if (mobileNavContainer.classList.contains('open')) {
                    spans[0].style.transform = 'translateY(8px) rotate(45deg)';
                    spans[1].style.opacity = '0';
                    spans[2].style.transform = 'translateY(-8px) rotate(-45deg)';
                } else {
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            });
        }

        // Re-attach theme toggle
        const themeBtn = document.getElementById('theme-toggle');
        const storedTheme = localStorage.getItem('vanguard_theme') || 'dark';
        if (themeBtn) {
            themeBtn.innerHTML = storedTheme === 'dark' ? '☀️' : '🌙';
            themeBtn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const target = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', target);
                localStorage.setItem('vanguard_theme', target);
                themeBtn.innerHTML = target === 'dark' ? '☀️' : '🌙';
            });
        }
        
        // Remove flicker, reveal navbar
        const globalNavbar = document.querySelector('.navbar');
        if(globalNavbar) {
            // Need slight timeout to ensure DOM update clears first
            setTimeout(() => {
                globalNavbar.classList.add('is-visible');
            }, 50);
        }
    };
    
    // Execute rendering
    renderDynamicNavbar();
});

// Global Hero CTA handler
window.handleHeroCTA = () => {
    if(window.VanguardAuth && window.VanguardAuth.getUser()) {
        window.location.href = 'features.html';
    } else {
        if(typeof openAuthModal === 'function') {
            openAuthModal('signup');
        } else {
            window.location.href = 'index.html'; // fallback
        }
    }
};

