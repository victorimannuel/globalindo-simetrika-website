document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('dynamic-services-container');
    const cardTemplate = document.getElementById('service-card-template');
    const itemTemplate = document.getElementById('service-item-template');

    if (container && container.children.length > 0) {
        return;
    }
    
    if (container && cardTemplate && itemTemplate) {
        try {
            // Using absolute root path so it works regardless of sub-directory depth
            const basePath = '/data/services.json';

            const res = await fetch(basePath);
            const servicesData = await res.json();
            
            servicesData.forEach((service, index) => {
                // Pre-register service translation into global i18n
                if (typeof translations !== 'undefined') {
                    translations[service.translation_key] = service.name;
                }
                
                const cardClone = cardTemplate.content.cloneNode(true);
                const cardDiv = cardClone.querySelector('.service-card');
                
                // Calculate animation delay dynamically based on index (0.1s, 0.2s, etc.)
                const calculatedDelay = ((index + 1) * 0.1).toFixed(1) + 's';
                cardDiv.style.transitionDelay = calculatedDelay;
                
                const iconDiv = cardClone.querySelector('.service-icon');
                if (iconDiv) {
                    if (service.icon.startsWith('<svg')) {
                        iconDiv.innerHTML = service.icon;
                    } else {
                        iconDiv.textContent = service.icon;
                    }
                }
                
                const titleElement = cardClone.querySelector('.service-title') || cardClone.querySelector('h3');
                if (titleElement) {
                    titleElement.setAttribute('data-i18n', service.translation_key);
                    // Just fallback to English directly, i18n will overwrite this anyway immediately below
                    titleElement.textContent = service.name.en;
                }
                
                const ul = cardClone.querySelector('.service-items-list') || cardClone.querySelector('ul');
                
                if (ul) {
                    // Sort items by order
                    const sortedItems = service.items.sort((a, b) => a.order - b.order);
                    
                    sortedItems.forEach(item => {
                        // Pre-register item translation into global i18n
                        if (typeof translations !== 'undefined') {
                            translations[item.translation_key] = item.name;
                        }
                        
                        const itemClone = itemTemplate.content.cloneNode(true);
                        const li = itemClone.querySelector('li');
                        if (li) {
                            li.setAttribute('data-i18n', item.translation_key);
                            li.textContent = item.name.en;
                        }
                        ul.appendChild(itemClone);
                    });
                }
                
                container.appendChild(cardClone);
            });
            
            // Re-run language translation purely for the newly added HTML DOM content
            if (window.setLanguage && window.getCurrentLang) {
                window.setLanguage(window.getCurrentLang());
            }

            // Immediately attach IntersectionObserver to new fade-in elements so they animate in
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
            
            container.querySelectorAll('.fade-in').forEach(el => {
                observer.observe(el);
            });

        } catch (error) {
            console.error('Error fetching services data:', error);
            container.innerHTML = '<p>Error loading services data.</p>';
        }
    }
});
