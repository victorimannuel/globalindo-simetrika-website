// ============================================
// PT. GLOBALINDO SIMETRIKA - Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // ---- Navbar scroll effect ----
    const navbar = document.querySelector('.navbar');
    const handleScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // ---- Mobile menu toggle ----
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            menu.classList.toggle('open');
        });
        // Close menu on link click
        menu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                menu.classList.remove('open');
            });
        });
    }

    // ---- Scroll animations ----
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
        observer.observe(el);
    });

    // ---- Counter animation ----
    const counters = document.querySelectorAll('[data-count]');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-count'));
                const suffix = el.getAttribute('data-suffix') || '';
                let current = 0;
                const increment = target / 60;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    el.textContent = Math.floor(current) + suffix;
                }, 20);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));

    // ---- Portfolio filter ----
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');

            portfolioCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = '';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 400);
                }
            });
        });
    });

    // ---- Smooth scroll for anchor links ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---- Custom Modern Cursor ----
    // ---- Custom Modern Cursor ----
    // Remove strict touch check because touch-capable Windows laptops evaluate to true but still use mice
    const initCursor = () => {
        const cursorDot = document.createElement('div');
        cursorDot.classList.add('custom-cursor-dot');
        document.body.appendChild(cursorDot);

        const cursorOutline = document.createElement('div');
        cursorOutline.classList.add('custom-cursor-outline');
        document.body.appendChild(cursorOutline);

        // Add a safety class so CSS only hides the real mouse if JS ran successfully
        document.body.classList.add('has-custom-cursor');

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let outlineX = window.innerWidth / 2;
        let outlineY = window.innerHeight / 2;
        let isMoving = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

            // If the user uses a mouse, ensure cursor is visible
            if (!isMoving) {
                cursorDot.style.opacity = 1;
                cursorOutline.style.opacity = 1;
                isMoving = true;
            }
        });

        const animateCursor = () => {
            let distX = mouseX - outlineX;
            let distY = mouseY - outlineY;

            outlineX += distX * 0.15; // smoothness factor
            outlineY += distY * 0.15;

            cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px) translate(-50%, -50%)`;

            requestAnimationFrame(animateCursor);
        };
        animateCursor();

        const trackHover = () => {
            const interactiveElements = document.querySelectorAll('a, button, .team-card, .service-card, .client-card, .portfolio-card');
            interactiveElements.forEach(el => {
                if (!el.dataset.cursorTracked) {
                    el.addEventListener('mouseenter', () => document.body.classList.add('custom-cursor-hover'));
                    el.addEventListener('mouseleave', () => document.body.classList.remove('custom-cursor-hover'));
                    el.dataset.cursorTracked = true;
                }
            });
        };
        trackHover();

        // Automatically track newly filtered elements if applicable
        setInterval(trackHover, 1500);
    };

    // Delay init slightly to ensure body is ready
    setTimeout(initCursor, 50);

    // ---- Portfolio Lightbox Modal ----
    // ---- Portfolio Lightbox Modal ----
    const createLightbox = () => {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';

        lightbox.innerHTML = `
            <div class="lightbox-content" style="max-width: 800px; text-align: center; overflow: hidden; display: flex; flex-direction: column;">
                <button class="lightbox-close">&times;</button>
                <div class="lightbox-gallery" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; max-height: 50vh; overflow-y: auto; background: var(--bg-color);"></div>
                <div class="lightbox-inner" style="padding: 40px;">
                    <div class="lightbox-icon" style="font-size: 4rem; margin-bottom: 20px;">🏗️</div>
                    <div class="lightbox-info" style="padding: 0;">
                        <p class="lightbox-category" style="display:inline-block; padding: 6px 16px; background: var(--blue-pale); color: var(--blue-light); border-radius: 100px; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 20px;"></p>
                        <h3 class="lightbox-title" style="color: var(--blue-dark); font-size: 1.8rem; line-height: 1.4; margin-bottom: 20px;"></h3>
                        <p style="color: var(--text-body); font-size: 1.05rem;" class="lightbox-desc">More details and documentation for this project are currently being prepared and will be updated soon. Thank you for your interest.</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(lightbox);

        const closeBtn = lightbox.querySelector('.lightbox-close');

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            setTimeout(() => {
                lightbox.querySelector('.lightbox-gallery').innerHTML = ''; // Clear images
            }, 300);
        };

        closeBtn.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });

        return lightbox;
    };

    const lightbox = createLightbox();
    const lightboxTitle = lightbox.querySelector('.lightbox-title');
    const lightboxCategory = lightbox.querySelector('.lightbox-category');
    const lightboxIcon = lightbox.querySelector('.lightbox-icon');
    const lightboxGallery = lightbox.querySelector('.lightbox-gallery');

    document.querySelectorAll('.portfolio-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h4').textContent;
            const category = card.querySelector('.card-category').textContent;

            // Check if user has defined a data-image attribute (comma separated)
            const imageSrcData = card.getAttribute('data-image');

            lightboxGallery.innerHTML = ''; // Reset gallery

            if (imageSrcData) {
                // Show real images, hide placeholder icon
                const images = imageSrcData.split(',').map(src => src.trim());

                if (images.length === 1) {
                    // Single image - make it wide
                    lightboxGallery.style.display = 'block';
                    lightboxGallery.innerHTML = `<img src="${images[0]}" alt="Project Image" style="width: 100%; max-height: 50vh; object-fit: cover; display: block;">`;
                } else {
                    // Multiple images - use css grid
                    lightboxGallery.style.display = 'grid';
                    images.forEach(src => {
                        lightboxGallery.innerHTML += `<img src="${src}" alt="Project Image" style="width: 100%; height: 250px; object-fit: cover; display: block;">`;
                    });
                }

                lightboxGallery.style.display = images.length === 1 ? 'block' : 'grid';
                lightboxIcon.style.display = 'none';
            } else {
                // Discover icon based on category string
                if (category.toLowerCase().includes('electrical')) {
                    lightboxIcon.textContent = '⚡';
                } else if (category.toLowerCase().includes('mechanical')) {
                    lightboxIcon.textContent = '⚙️';
                } else {
                    lightboxIcon.textContent = '🏗️';
                }
                lightboxGallery.style.display = 'none';
                lightboxIcon.style.display = 'block';
            }

            lightboxTitle.textContent = title;
            lightboxCategory.textContent = category;

            lightbox.classList.add('active');
        });
    });
});
