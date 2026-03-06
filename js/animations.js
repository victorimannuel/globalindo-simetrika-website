/**
 * PT. GLOBALINDO SIMETRIKA - Sharp & Impactful Animations
 * Focused on spring physics and clean transformations (No Blurs).
 */

import { animate, scroll, inView, stagger } from "https://cdn.jsdelivr.net/npm/motion@11.11.17/+esm"

const springBouncy = { type: "spring", stiffness: 300, damping: 15 };
const springSmooth = { type: "spring", stiffness: 100, damping: 20 };
const springSnap = { type: "spring", stiffness: 500, damping: 30 };

// ---- HERO ENTRANCE ----
export function initHeroAnimations() {
    // 1. Reveal Navbar (Drop from top)
    animate(".navbar", { y: [-80, 0], opacity: [0, 1] }, { duration: 0.6, easing: "ease-out" });

    // 2. Hero Content - Sharp Reveal
    // Badge pops in with bounce
    animate(".hero-badge",
        { scale: [0.3, 1], opacity: [0, 1] },
        { duration: 0.8, easing: springBouncy }
    );

    // Main Title - Strong slide from bottom
    animate(".hero h1",
        { y: [60, 0], opacity: [0, 1] },
        { delay: 0.2, duration: 0.8, easing: [0.25, 1, 0.5, 1] }
    );

    // Subtitle - Clean slide
    animate(".hero p",
        { y: [30, 0], opacity: [0, 1] },
        { delay: 0.4, duration: 0.8, easing: "ease-out" }
    );

    // Buttons - Individual pop-in
    animate(".hero-buttons .btn",
        { scale: [0.8, 1], opacity: [0, 1] },
        { delay: stagger(0.1, { start: 0.6 }), duration: 0.5, easing: springBouncy }
    );

    // Stats - Staggered entrance
    animate(".hero-stat",
        { opacity: [0, 1], y: [40, 0] },
        { delay: stagger(0.1, { start: 0.8 }), duration: 0.7, easing: springSmooth }
    );

    // 3. Floating Shapes Background
    document.querySelectorAll('.hero-shape').forEach((shape, i) => {
        animate(shape,
            {
                y: [0, -50, 0],
                x: [0, i % 2 === 0 ? 20 : -20, 0],
                rotate: [15 + (i * 10), -5 - (i * 5), 15 + (i * 10)],
                scale: [1, 1.05, 1]
            },
            {
                duration: 12 + i * 4,
                repeat: Infinity,
                easing: "linear"
            }
        );
    });
}

// ---- SCROLL REVEAL ----
export function initScrollAnimations() {
    // Groups of elements that should reveal together
    const groups = [
        '.service-card',
        '.vm-card',
        '.stat-card',
        '.legal-card',
        '.cert-card',
        '.achievement-card',
        '.portfolio-item'
    ];

    // Single item reveals
    inView('.section-header, .about-text, .about-image', ({ target }) => {
        animate(target,
            { opacity: [0, 1], y: [50, 0] },
            { duration: 0.8, easing: [0.16, 1, 0.3, 1] }
        );
    }, { amount: 0.3 });

    // Grouped items with staggering
    document.querySelectorAll('.vm-grid, .services-grid, .about-grid, .team-grid, .portfolio-grid').forEach(grid => {
        inView(grid, () => {
            const items = grid.querySelectorAll('.vm-card, .service-card, .team-member, .portfolio-item, .legal-card, .cert-card');
            if (items.length) {
                animate(items,
                    { opacity: [0, 1], scale: [0.9, 1], y: [40, 0] },
                    { delay: stagger(0.15), duration: 0.7, easing: springSmooth }
                );
            }
        }, { amount: 0.1 });
    });

    // Parallax on shapes
    document.querySelectorAll('.hero-shape').forEach(shape => {
        scroll(
            animate(shape, { y: [0, 200] }),
            { target: document.body, offset: ["start start", "end end"] }
        );
    });
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.hero')) {
        initHeroAnimations();
    }
    initScrollAnimations();
});
