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

    const sections = document.querySelectorAll('.fade-in-section');
    sections.forEach(section => {
        observer.observe(section);
    });
});
