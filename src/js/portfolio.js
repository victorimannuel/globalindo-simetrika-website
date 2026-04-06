// ============================================
// Portfolio Dynamic Renderer
// Fetches /data/portfolio.json and renders:
//   - Portfolio cards (filterable grid)
//   - Timeline section
// ============================================

const CATEGORY_LABELS = {
    electrical: { en: 'Electrical & Instrumentation', id: 'Listrik & Instrumentasi' },
    mechanical:  { en: 'Mechanical',                   id: 'Mekanikal' },
    civil:       { en: 'Civil Work',                   id: 'Pekerjaan Sipil' }
};

// Resolve image path: always absolute so it works regardless of sub-directory depth
function imgPath(folder, file) {
    return `/images/portfolio/${folder}/${file}`;
}

function getCurrentLang() {
    return localStorage.getItem('gs-lang') || 'en';
}

function renderProjects(projects) {
    const lang = getCurrentLang();
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;

    grid.innerHTML = projects.map((p, i) => {
        const imageList = p.images.map(f => imgPath(p.folder, f)).join(', ');
        const thumb = imgPath(p.folder, p.images[0]);
        const catLabel = CATEGORY_LABELS[p.category]?.[lang] ?? p.category;
        const title = p.title?.[lang] ?? p.title?.en ?? '';
        const num = '#' + p.id.toString().padStart(2, '0').replace(/[a-z]/g, '');

        return `<div class="portfolio-card fade-in" data-category="${p.category}" data-image="${imageList}">
            <div class="portfolio-thumb"><img src="${thumb}" alt="${title}" loading="${i < 6 ? 'eager' : 'lazy'}"></div>
            <span class="card-number">${num}</span>
            <span class="card-category" data-portfolio-cat="${p.category}">${catLabel}</span>
            <h4>${title}</h4>
        </div>`;
    }).join('');

    // Re-apply filter (in case a filter was active before render)
    applyActiveFilter();

    // Re-init observers so new cards fade in
    if (typeof window.reinitObserver === 'function') window.reinitObserver();
}

function renderTimeline(timeline) {
    const lang = getCurrentLang();
    const container = document.getElementById('portfolio-timeline');
    if (!container) return;

    container.innerHTML = timeline.map(yearBlock => {
        const items = yearBlock.items.map(item => {
            const detail = [item.client, item.location].filter(Boolean).join(' | ');
            return `<div class="timeline-item">
                <h4>${item.title}</h4>
                ${detail ? `<p>${detail}</p>` : ''}
            </div>`;
        }).join('');

        return `<div class="timeline-year">
            <div class="year-badge">●</div>
            <h3>${yearBlock.year}</h3>
            <div class="timeline-items">${items}</div>
        </div>`;
    }).join('');
}

function applyActiveFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    const filter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
    document.querySelectorAll('.portfolio-card').forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
    });
}

// Re-render text when language changes (called by i18n.js via window.onLangChange)
function updatePortfolioLang() {
    const lang = getCurrentLang();
    // Update category labels on existing cards
    document.querySelectorAll('[data-portfolio-cat]').forEach(el => {
        const cat = el.getAttribute('data-portfolio-cat');
        el.textContent = CATEGORY_LABELS[cat]?.[lang] ?? cat;
    });
    // Update card titles
    if (window._portfolioData) {
        const lang2 = lang;
        document.querySelectorAll('.portfolio-card h4').forEach((h4, i) => {
            const p = window._portfolioData.projects[i];
            if (p) h4.textContent = p.title?.[lang2] ?? p.title?.en ?? '';
        });
    }
}

// Expose for i18n hook
window.updatePortfolioLang = updatePortfolioLang;

// Main init
async function initPortfolio() {
    const grid = document.getElementById('portfolio-grid');
    const timeline = document.getElementById('portfolio-timeline');

    if (grid && timeline && grid.children.length > 0 && timeline.children.length > 0) {
        return;
    }

    try {
        const res = await fetch('/data/portfolio.json');
        const data = await res.json();
        window._portfolioData = data;

        renderProjects(data.projects);
        renderTimeline(data.timeline);
    } catch (err) {
        console.error('Portfolio: failed to load portfolio.json', err);
    }
}

document.addEventListener('DOMContentLoaded', initPortfolio);
