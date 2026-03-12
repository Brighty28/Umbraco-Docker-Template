// =============================================================================
// App.js – Minimal client-side JavaScript
// =============================================================================

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // Mobile menu toggle
    // -------------------------------------------------------------------------
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('is-open');
            const isOpen = mobileMenu.classList.contains('is-open');
            menuToggle.setAttribute('aria-expanded', isOpen);
        });
    }

    // -------------------------------------------------------------------------
    // Scroll-triggered animations (IntersectionObserver)
    // -------------------------------------------------------------------------
    const animatedElements = document.querySelectorAll('[data-animate]');

    if (animatedElements.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        animatedElements.forEach((el) => observer.observe(el));
    }

    // -------------------------------------------------------------------------
    // Runtime config access
    // -------------------------------------------------------------------------
    const config = window.__SITE_CONFIG__ || {};

    if (config.features?.dark_mode) {
        // Respect OS preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    console.log(`[${config.client?.name || 'Website'}] Loaded successfully.`);
})();
