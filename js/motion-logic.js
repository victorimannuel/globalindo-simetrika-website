import { animate, scroll } from "https://cdn.jsdelivr.net/npm/motion@11.11.13/+esm"

// 1. Hero Entrance Animation
animate(".hero-content", 
    { opacity: [0, 1], y: [100, 0] }, 
    { duration: 1.2, easing: [0.17, 0.55, 0.55, 1] }
)

animate(".hero-badge", 
    { scale: [0.5, 1], opacity: [0, 1] }, 
    { delay: 0.2, duration: 0.8, easing: "ease-out" }
)

animate(".hero h1", 
    { opacity: [0, 1], x: [-50, 0] }, 
    { delay: 0.4, duration: 1, easing: "ease-out" }
)

// 2. Continuous Floating Shapes
document.querySelectorAll('.hero-shape').forEach((shape, i) => {
    animate(shape, 
        { 
            y: [0, -40, 0],
            rotate: [15 * (i+1), -15 * (i+1), 15 * (i+1)] 
        }, 
        { 
            duration: 5 + i * 2, 
            repeat: Infinity, 
            easing: "ease-in-out" 
        }
    )
})

// 3. Scroll Reveal (Replacing AOS/IntersectionObserver)
document.querySelectorAll('.section-header, .about-grid, .vm-card').forEach((el) => {
    scroll(
        animate(el, { opacity: [0, 1], y: [50, 0] }, { duration: 0.8 }),
        { target: el, offset: ["start end", "center center"] }
    )
})
