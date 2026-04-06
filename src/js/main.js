// ---- PT. GLOBALINDO SIMETRIKA - Main JavaScript ----

function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const handleScroll = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        };
        // Remove any previous listener to avoid duplicates
        window.removeEventListener('scroll', window._gsHandleScroll);
        window._gsHandleScroll = handleScroll;
        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }

    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    if (toggle && menu) {
        // Clone to strip old listeners before re-attaching
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);

        newToggle.addEventListener('click', () => {
            newToggle.classList.toggle('active');
            menu.classList.toggle('open');
        });
        menu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                newToggle.classList.remove('active');
                menu.classList.remove('open');
            });
        });
    }

    // Mark active nav link based on current path
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link[data-nav-path]').forEach(link => {
        const navPath = link.getAttribute('data-nav-path');
        // Root: exact match. Sub-pages: startsWith so /about/ matches /about/anything
        const isActive = (navPath === '/')
            ? (path === '/' || path === '/en/' || path === '/id/')
            : path.includes(navPath);
        link.classList.toggle('active', isActive);
    });

    // Populate footer address from CONFIG
    const addrEl = document.getElementById('footer-address');
    if (addrEl && typeof CONFIG !== 'undefined') {
        addrEl.textContent = CONFIG.address;
    }
}

// ---- Navbar scroll effect + mobile toggle ----
function injectStructuredData() {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "name": "PT. Globalindo Simetrika",
                "url": "https://globalindosimetrika.co.id/"
            },
            {
                "@type": "Organization",
                "name": "PT. Globalindo Simetrika",
                "url": "https://globalindosimetrika.co.id/",
                "logo": "https://globalindosimetrika.co.id/images/logo.webp",
                "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+62-812-3456-7890",
                    "contactType": "customer service",
                    "areaServed": "ID",
                    "availableLanguage": ["Indonesian", "English"]
                },
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Jl. Cibodas Raya Ruko No.1, Antapani Tengah, Antapani, Bandung",
                    "addressLocality": "Bandung",
                    "addressRegion": "Jawa Barat",
                    "postalCode": "40291",
                    "addressCountry": "ID"
                },
                "sameAs": []
            }
        ]
    });
    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize navbar
    initNavbar();
    injectStructuredData();

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

    window.reinitObserver = () => {
        document.querySelectorAll('.fade-in:not(.visible), .fade-in-left:not(.visible), .fade-in-right:not(.visible)').forEach(el => {
            observer.observe(el);
        });
    };

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

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');

            // Query dynamically since cards may be injected asynchronously
            document.querySelectorAll('.portfolio-card').forEach(card => {
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
                    <div class="lightbox-icon" style="font-size: 4rem; margin-bottom: 20px;"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2"></path><path d="M22 10.33V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9.67"></path><path d="M2 22h20"></path></svg></div>
                    <div class="lightbox-info" style="padding: 0;">
                        <p class="lightbox-category" style="display:inline-block; padding: 6px 16px; background: var(--blue-pale); color: var(--blue-light); border-radius: 4px; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 20px;"></p>
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

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.portfolio-card');
        if (!card) return;

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
                lightboxIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
            } else if (category.toLowerCase().includes('mechanical')) {
                lightboxIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
            } else {
                lightboxIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2"></path><path d="M22 10.33V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9.67"></path><path d="M2 22h20"></path></svg>';
            }
            lightboxGallery.style.display = 'none';
            lightboxIcon.style.display = 'block';
        }

        lightboxTitle.textContent = title;
        lightboxCategory.textContent = category;

        lightbox.classList.add('active');
    });

    // ---- Image Popup Modal ----
    const createImageModal = () => {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-content">
                <button class="image-modal-close">&times;</button>
                <img src="" alt="Full size image">
            </div>
        `;
        document.body.appendChild(modal);

        const img = modal.querySelector('img');
        const closeBtn = modal.querySelector('.image-modal-close');

        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => { img.src = ''; }, 300);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
        });

        return { modal, img };
    };

    const imageModal = createImageModal();

    // Use event delegation for better reliability (handles dynamically added content or late script execution)
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.image-popup-trigger');
        if (trigger) {
            const imgSrc = trigger.getAttribute('data-image');
            if (imgSrc) {
                imageModal.img.src = imgSrc;
                imageModal.modal.classList.add('active');
                // Ensure the image exists or show error/loading?
            }
        }
    });



    // ---- Single Source of Truth for Dynamic Data ----
    const syncConfig = () => {
        if (typeof CONFIG !== 'undefined') {
            // Update all WhatsApp links
            document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
                const currentHref = link.getAttribute('href');
                if (currentHref.includes('wa.me')) {
                    link.setAttribute('href', `https://wa.me/${CONFIG.whatsappNumber}`);
                }
            });

            // Update email links if any
            document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
                link.setAttribute('href', `mailto:${CONFIG.email}`);
            });
        }

        // Forcibly remove WhatsApp floating button if it exists
        document.querySelectorAll('.whatsapp-float').forEach(el => el.remove());
    };
    syncConfig();
});
