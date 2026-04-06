import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

// ============================================================
// CONFIG
// ============================================================
const SRC_DIR = './src';
const DIST_DIR = './dist';
const LANGS = ['en', 'id'];
const BASE_URL = 'https://globalindosimetrika.co.id';
const DEFAULT_LANG = 'en';

// ============================================================
// HELPERS
// ============================================================
const mkdirp = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const readJson = (relPath) => JSON.parse(fs.readFileSync(path.join(SRC_DIR, relPath), 'utf8'));

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getLocalized = (value, lang) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value;
    return value?.[lang] ?? value?.en ?? '';
};

const copyAssets = (src, dest) => {
    mkdirp(dest);
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyAssets(srcPath, destPath);
        } else if (!entry.name.endsWith('.html')) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

const pageSlugFromRelPath = (relPath) => {
    const dir = path.dirname(relPath);
    return dir === '.' ? '' : dir;
};

const buildUrls = (slug, lang) => {
    const suffix = slug ? `${lang}/${slug}/` : `${lang}/`;
    return `${BASE_URL}/${suffix}`;
};

const buildRelativeUrl = (slug, lang) => {
    return `/${buildUrls(slug, lang).replace(`${BASE_URL}/`, '')}`;
};

const parseObjectLiteral = (content, pattern, errorMessage) => {
    const match = content.match(pattern);
    if (!match) {
        console.error(errorMessage);
        process.exit(1);
    }
    return eval(`(${match[1]})`);
};

const renderListItems = (items) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

const renderDetailLink = (href, label) => (
    `<div class="detail-actions"><a href="${href}" class="detail-link">${escapeHtml(label)} <span aria-hidden="true">›</span></a></div>`
);

const rootRelativeImage = (folder, file) => `/images/portfolio/${folder}/${file}`;

// ============================================================
// LOAD TRANSLATIONS / CONFIG / DATA
// ============================================================
const i18nContent = fs.readFileSync(path.join(SRC_DIR, 'js', 'i18n.js'), 'utf8');
const translations = parseObjectLiteral(
    i18nContent,
    /const translations = ({[\s\S]+?});/,
    'ERROR: Could not parse translations from i18n.js'
);

const configContent = fs.readFileSync(path.join(SRC_DIR, 'js', 'config.js'), 'utf8');
const runtimeConfig = parseObjectLiteral(
    configContent,
    /const CONFIG = ({[\s\S]+?});/,
    'ERROR: Could not parse config from config.js'
);

const servicesCatalog = readJson(path.join('data', 'services.json'));
const portfolioCatalog = readJson(path.join('data', 'portfolio.json'));
const seoContent = readJson(path.join('data', 'seo-content.json'));

servicesCatalog.forEach((service) => {
    translations[service.translation_key] = service.name;
    service.items.forEach((item) => {
        translations[item.translation_key] = item.name;
    });
});

const navbarRaw = fs.readFileSync(path.join(SRC_DIR, 'parts', 'navbar.html'), 'utf8');
const footerRaw = fs.readFileSync(path.join(SRC_DIR, 'parts', 'footer.html'), 'utf8');

const categoryLabels = {
    electrical: { en: 'Electrical & Instrumentation', id: 'Elektrikal & Instrumentasi' },
    mechanical: { en: 'Mechanical', id: 'Mekanikal' },
    civil: { en: 'Civil Work', id: 'Pekerjaan Sipil' }
};

const sectionText = {
    home: { en: 'Home', id: 'Beranda' },
    services: { en: 'Services', id: 'Layanan' },
    portfolio: { en: 'Portfolio', id: 'Portofolio' },
    overview: { en: 'Overview', id: 'Ikhtisar' },
    scope: { en: 'Key scope', id: 'Ruang lingkup utama' },
    commonNeeds: { en: 'Common client needs', id: 'Kebutuhan klien yang umum' },
    workflow: { en: 'Delivery workflow', id: 'Alur pelaksanaan' },
    industries: { en: 'Industries served', id: 'Industri yang dilayani' },
    exploreService: { en: 'Explore service scope', id: 'Lihat detail layanan' },
    serviceCoverageLabel: { en: 'Service guides', id: 'Panduan layanan' },
    serviceCoverageTitle: { en: 'What each service line covers', id: 'Cakupan setiap lini layanan' },
    serviceCoverageSubtitle: {
        en: 'These service pages are structured around real project needs, execution flow, and operating environments.',
        id: 'Halaman layanan ini disusun berdasarkan kebutuhan proyek nyata, alur pelaksanaan, dan lingkungan operasi.'
    },
    faqLabel: { en: 'Common questions', id: 'Pertanyaan umum' },
    faqTitle: { en: 'Questions we hear before mobilization', id: 'Pertanyaan yang sering muncul sebelum mobilisasi' },
    featuredLabel: { en: 'Featured case studies', id: 'Studi kasus unggulan' },
    featuredTitle: { en: 'Representative project stories', id: 'Ringkasan proyek representatif' },
    featuredSubtitle: {
        en: 'Selected examples that show how we approach industrial electrical, mechanical, civil, and procurement work.',
        id: 'Contoh terpilih yang menunjukkan pendekatan kami pada pekerjaan elektrikal, mekanikal, sipil, dan pengadaan.'
    },
    viewCaseStudy: { en: 'View case study', id: 'Lihat studi kasus' },
    projectContext: { en: 'Project context', id: 'Konteks proyek' },
    projectApproach: { en: 'Execution approach', id: 'Pendekatan pelaksanaan' },
    challenge: { en: 'Challenge', id: 'Tantangan' },
    solution: { en: 'Solution', id: 'Solusi' },
    outcome: { en: 'Outcome', id: 'Hasil' },
    gallery: { en: 'Project gallery', id: 'Galeri proyek' },
    relatedService: { en: 'Related service', id: 'Layanan terkait' },
    client: { en: 'Client type', id: 'Jenis klien' },
    location: { en: 'Location', id: 'Lokasi' },
    sector: { en: 'Sector', id: 'Sektor' },
    capability: { en: 'Capability', id: 'Kapabilitas' },
    discussProject: { en: 'Discuss your project', id: 'Diskusikan proyek Anda' },
    discussProjectDesc: {
        en: 'Tell us the site condition, technical problem, or procurement requirement and our team will help define the next steps.',
        id: 'Sampaikan kondisi lokasi, masalah teknis, atau kebutuhan pengadaan Anda dan tim kami akan membantu menentukan langkah berikutnya.'
    }
};

const servicesBySlug = new Map(servicesCatalog.map((service) => [service.slug, service]));
const serviceDetailsBySlug = new Map(seoContent.services.map((service) => [service.slug, service]));
const projectsByFolder = new Map(portfolioCatalog.projects.map((project) => [project.folder, project]));
const caseStudiesByFolder = new Map(seoContent.featuredCaseStudies.map((item) => [item.folder, item]));
const relatedServiceByCaseFolder = new Map();

seoContent.services.forEach((service) => {
    (service.featuredProjects || []).forEach((folder) => {
        if (!relatedServiceByCaseFolder.has(folder)) {
            relatedServiceByCaseFolder.set(folder, service.slug);
        }
    });
});

const cleanWhatsappNumber = String(runtimeConfig.whatsappNumber || '').replace(/\D/g, '');
const businessTelephone = seoContent.business.telephone || (cleanWhatsappNumber ? `+${cleanWhatsappNumber}` : '');

// ============================================================
// CONTENT RENDERERS
// ============================================================
const renderServiceCards = (lang) => servicesCatalog.map((service, index) => {
    const detail = serviceDetailsBySlug.get(service.slug);
    const items = [...service.items].sort((a, b) => a.order - b.order);
    const serviceName = getLocalized(service.name, lang);
    const summary = getLocalized(detail?.summary, lang);
    const href = `/services/${service.slug}/`;

    return `<article class="service-card fade-in" style="transition-delay:${((index + 1) * 0.1).toFixed(1)}s">
        <div class="service-icon">${service.icon}</div>
        <h3>${escapeHtml(serviceName)}</h3>
        <p>${escapeHtml(summary)}</p>
        <ul>${renderListItems(items.map((item) => getLocalized(item.name, lang)))}</ul>
        <a href="${href}" class="card-link">${escapeHtml(getLocalized(sectionText.exploreService, lang))} <span aria-hidden="true">›</span></a>
    </article>`;
}).join('');

const renderServiceDetailSections = (lang) => {
    const cards = servicesCatalog.map((service) => {
        const detail = serviceDetailsBySlug.get(service.slug);
        if (!detail) return '';

        return `<article class="detail-card fade-in">
            <span class="detail-kicker">${escapeHtml(getLocalized(service.name, lang))}</span>
            <h3>${escapeHtml(getLocalized(detail.summary, lang))}</h3>
            <p>${escapeHtml(getLocalized(detail.intro, lang))}</p>
            <p><strong>${escapeHtml(getLocalized(sectionText.commonNeeds, lang))}:</strong> ${escapeHtml(getLocalized(detail.problems, lang).join(', '))}</p>
            <p><strong>${escapeHtml(getLocalized(sectionText.industries, lang))}:</strong> ${escapeHtml(getLocalized(detail.industries, lang).join(', '))}</p>
            ${renderDetailLink(`/services/${service.slug}/`, getLocalized(sectionText.exploreService, lang))}
        </article>`;
    }).join('');

    return `<section class="section section-white">
        <div class="container">
            <div class="section-header center fade-in">
                <div class="section-label">${escapeHtml(getLocalized(sectionText.serviceCoverageLabel, lang))}</div>
                <h2 class="section-title">${escapeHtml(getLocalized(sectionText.serviceCoverageTitle, lang))}</h2>
                <p class="section-subtitle">${escapeHtml(getLocalized(sectionText.serviceCoverageSubtitle, lang))}</p>
            </div>
            <div class="detail-grid">${cards}</div>
        </div>
    </section>`;
};

const renderServiceFaqSection = (lang) => {
    const items = seoContent.services.flatMap((service) => service.faq || []);
    if (!items.length) return '';

    return `<section class="section section-light">
        <div class="container">
            <div class="section-header center fade-in">
                <div class="section-label">${escapeHtml(getLocalized(sectionText.faqLabel, lang))}</div>
                <h2 class="section-title">${escapeHtml(getLocalized(sectionText.faqTitle, lang))}</h2>
            </div>
            <div class="faq-grid">
                ${items.map((faq) => `<article class="faq-item fade-in">
                    <h3>${escapeHtml(getLocalized(faq.question, lang))}</h3>
                    <p>${escapeHtml(getLocalized(faq.answer, lang))}</p>
                </article>`).join('')}
            </div>
        </div>
    </section>`;
};

const genericProjectSummary = (category, lang) => {
    const summaries = {
        electrical: {
            en: 'Industrial electrical and automation work delivered with a focus on reliability, testing, and safe recommissioning.',
            id: 'Pekerjaan elektrikal dan otomasi industri dengan fokus pada keandalan, pengujian, dan recommissioning yang aman.'
        },
        mechanical: {
            en: 'Mechanical installation and maintenance work coordinated for safe field execution in active industrial environments.',
            id: 'Pekerjaan instalasi dan pemeliharaan mekanikal yang dikoordinasikan untuk eksekusi lapangan yang aman di lingkungan industri aktif.'
        },
        civil: {
            en: 'Civil construction and site-improvement work planned around quality control, sequence, and field practicality.',
            id: 'Pekerjaan konstruksi sipil dan peningkatan area yang direncanakan dengan mempertimbangkan kontrol mutu, urutan kerja, dan kepraktisan lapangan.'
        }
    };
    return summaries[category]?.[lang] ?? summaries[category]?.en ?? '';
};

const renderPortfolioCard = (project, lang) => {
    const caseStudy = caseStudiesByFolder.get(project.folder);
    const imageList = project.images.map((file) => rootRelativeImage(project.folder, file)).join(', ');
    const thumb = rootRelativeImage(project.folder, project.images[0]);
    const categoryLabel = getLocalized(categoryLabels[project.category], lang);
    const title = getLocalized(project.title, lang);
    const summary = caseStudy ? getLocalized(caseStudy.summary, lang) : genericProjectSummary(project.category, lang);
    const caseStudyLink = caseStudy
        ? `<div class="card-actions"><a href="/portfolio/${project.folder}/" class="card-link" data-case-study-link>${escapeHtml(getLocalized(sectionText.viewCaseStudy, lang))} <span aria-hidden="true">›</span></a></div>`
        : '';

    return `<article class="portfolio-card fade-in" data-category="${escapeHtml(project.category)}" data-image="${escapeHtml(imageList)}">
        <div class="portfolio-thumb"><img src="${thumb}" alt="${escapeHtml(title)}" loading="lazy"></div>
        <span class="card-number">#${escapeHtml(String(project.id).replace(/[^\d]/g, '') || String(project.id))}</span>
        <span class="card-category">${escapeHtml(categoryLabel)}</span>
        <h4>${escapeHtml(title)}</h4>
        <p class="portfolio-card-summary">${escapeHtml(summary)}</p>
        ${caseStudyLink}
    </article>`;
};

const renderPortfolioTimeline = () => portfolioCatalog.timeline.map((yearBlock) => {
    const items = yearBlock.items.map((item) => {
        const detail = [item.client, item.location].filter(Boolean).join(' | ');
        return `<div class="timeline-item">
            <h4>${escapeHtml(item.title)}</h4>
            ${detail ? `<p>${escapeHtml(detail)}</p>` : ''}
        </div>`;
    }).join('');

    return `<div class="timeline-year">
        <div class="year-badge">●</div>
        <h3>${escapeHtml(yearBlock.year)}</h3>
        <div class="timeline-items">${items}</div>
    </div>`;
}).join('');

const renderCaseStudyCard = (folder, lang) => {
    const project = projectsByFolder.get(folder);
    const caseStudy = caseStudiesByFolder.get(folder);
    if (!project || !caseStudy) return '';

    return `<article class="case-study-card fade-in">
        <span class="case-study-kicker">${escapeHtml(getLocalized(categoryLabels[project.category], lang))}</span>
        <h3>${escapeHtml(getLocalized(project.title, lang))}</h3>
        <p>${escapeHtml(getLocalized(caseStudy.summary, lang))}</p>
        <div class="case-study-meta">${escapeHtml(getLocalized(caseStudy.client, lang))} | ${escapeHtml(getLocalized(caseStudy.location, lang))}</div>
        ${renderDetailLink(`/portfolio/${folder}/`, getLocalized(sectionText.viewCaseStudy, lang))}
    </article>`;
};

const renderFeaturedCaseStudiesSection = (lang) => {
    return `<section class="section section-white">
        <div class="container">
            <div class="section-header center fade-in">
                <div class="section-label">${escapeHtml(getLocalized(sectionText.featuredLabel, lang))}</div>
                <h2 class="section-title">${escapeHtml(getLocalized(sectionText.featuredTitle, lang))}</h2>
                <p class="section-subtitle">${escapeHtml(getLocalized(sectionText.featuredSubtitle, lang))}</p>
            </div>
            <div class="case-study-grid">
                ${seoContent.featuredCaseStudies.map((item) => renderCaseStudyCard(item.folder, lang)).join('')}
            </div>
        </div>
    </section>`;
};

const createPageDocument = ({ title, description, bodyContent, pageClass = '' }) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(description)}">
    <title>${escapeHtml(title)}</title>

    <link rel="canonical" href="${BASE_URL}/" />
    <!-- HREFLANG_PLACEHOLDER -->

    <meta property="og:type" content="website">
    <meta property="og:url" content="${BASE_URL}/">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:site_name" content="PT. Globalindo Simetrika">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${BASE_URL}/images/og-main.png">

    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${BASE_URL}/">
    <meta property="twitter:title" content="${escapeHtml(title)}">
    <meta property="twitter:description" content="${escapeHtml(description)}">
    <meta property="twitter:image" content="${BASE_URL}/images/og-main.png">

    <link rel="icon" type="image/webp" href="/images/logo.webp">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="preload" href="/css/style.css" as="style">
    <link rel="preload" href="/images/logo.webp" as="image" fetchpriority="high">
</head>
<body${pageClass ? ` class="${pageClass}"` : ''}>
    <div id="navbar-placeholder"></div>
    ${bodyContent}
    <div id="footer-placeholder"></div>
    <script src="/js/config.js"></script>
    <script src="/js/main.js"></script>
    <script type="module" src="/js/animations.js"></script>
</body>
</html>`;

const renderServiceDetailPage = (service, detail, lang) => {
    const serviceName = getLocalized(service.name, lang);
    const summary = getLocalized(detail.summary, lang);
    const intro = getLocalized(detail.intro, lang);
    const scope = [...service.items].sort((a, b) => a.order - b.order).map((item) => getLocalized(item.name, lang));
    const problems = getLocalized(detail.problems, lang);
    const workflow = getLocalized(detail.workflow, lang);
    const industries = getLocalized(detail.industries, lang);
    const faqs = detail.faq || [];
    const related = (detail.featuredProjects || []).map((folder) => renderCaseStudyCard(folder, lang)).join('');

    return createPageDocument({
        title: `${serviceName} | PT. Globalindo Simetrika`,
        description: summary,
        bodyContent: `
            <section class="page-header">
                <div class="container">
                    <div class="breadcrumb"><a href="/">${escapeHtml(getLocalized(sectionText.home, lang))}</a><span class="separator">›</span><a href="/services/">${escapeHtml(getLocalized(sectionText.services, lang))}</a><span class="separator">›</span><span>${escapeHtml(serviceName)}</span></div>
                    <h1>${escapeHtml(serviceName)}</h1>
                    <p>${escapeHtml(summary)}</p>
                </div>
            </section>

            <section class="section section-white">
                <div class="container">
                    <div class="detail-grid">
                        <article class="detail-card fade-in">
                            <span class="detail-kicker">${escapeHtml(getLocalized(sectionText.overview, lang))}</span>
                            <h3>${escapeHtml(getLocalized(sectionText.scope, lang))}</h3>
                            <p>${escapeHtml(intro)}</p>
                            <ul>${renderListItems(scope)}</ul>
                        </article>
                        <article class="detail-card fade-in">
                            <span class="detail-kicker">${escapeHtml(getLocalized(sectionText.commonNeeds, lang))}</span>
                            <h3>${escapeHtml(getLocalized(sectionText.projectApproach, lang))}</h3>
                            <ul>${renderListItems(problems)}</ul>
                        </article>
                    </div>
                </div>
            </section>

            <section class="section section-light">
                <div class="container">
                    <div class="detail-grid">
                        <article class="detail-card fade-in">
                            <span class="detail-kicker">${escapeHtml(getLocalized(sectionText.workflow, lang))}</span>
                            <h3>${escapeHtml(getLocalized(sectionText.projectApproach, lang))}</h3>
                            <ul>${renderListItems(workflow)}</ul>
                        </article>
                        <article class="detail-card fade-in">
                            <span class="detail-kicker">${escapeHtml(getLocalized(sectionText.industries, lang))}</span>
                            <h3>${escapeHtml(getLocalized(sectionText.industries, lang))}</h3>
                            <ul>${renderListItems(industries)}</ul>
                        </article>
                    </div>
                </div>
            </section>

            ${related ? `<section class="section section-white">
                <div class="container">
                    <div class="section-header center fade-in">
                        <div class="section-label">${escapeHtml(getLocalized(sectionText.featuredLabel, lang))}</div>
                        <h2 class="section-title">${escapeHtml(getLocalized(sectionText.featuredTitle, lang))}</h2>
                    </div>
                    <div class="case-study-grid">${related}</div>
                </div>
            </section>` : ''}

            ${faqs.length ? `<section class="section section-light">
                <div class="container">
                    <div class="section-header center fade-in">
                        <div class="section-label">${escapeHtml(getLocalized(sectionText.faqLabel, lang))}</div>
                        <h2 class="section-title">${escapeHtml(getLocalized(sectionText.faqTitle, lang))}</h2>
                    </div>
                    <div class="faq-grid">
                        ${faqs.map((faq) => `<article class="faq-item fade-in">
                            <h3>${escapeHtml(getLocalized(faq.question, lang))}</h3>
                            <p>${escapeHtml(getLocalized(faq.answer, lang))}</p>
                        </article>`).join('')}
                    </div>
                </div>
            </section>` : ''}

            <section class="cta-section">
                <div class="container fade-in">
                    <h2>${escapeHtml(getLocalized(sectionText.discussProject, lang))}</h2>
                    <p>${escapeHtml(getLocalized(sectionText.discussProjectDesc, lang))}</p>
                    <a href="/contact/" class="btn btn-primary">${escapeHtml(getLocalized(sectionText.discussProject, lang))} <span aria-hidden="true">›</span></a>
                </div>
            </section>
        `
    });
};

const renderCaseStudyPage = (project, caseStudy, serviceSlug, lang) => {
    const title = getLocalized(project.title, lang);
    const summary = getLocalized(caseStudy.summary, lang);
    const serviceName = serviceSlug ? getLocalized(servicesBySlug.get(serviceSlug)?.name, lang) : '';
    const galleryImages = project.images.slice(0, 4).map((file, index) => {
        const src = rootRelativeImage(project.folder, file);
        return `<div class="image-popup-trigger" data-image="${src}"><img src="${src}" alt="${escapeHtml(title)}" loading="${index === 0 ? 'eager' : 'lazy'}"></div>`;
    }).join('');

    return createPageDocument({
        title: `${title} | PT. Globalindo Simetrika`,
        description: summary,
        bodyContent: `
            <section class="page-header">
                <div class="container">
                    <div class="breadcrumb"><a href="/">${escapeHtml(getLocalized(sectionText.home, lang))}</a><span class="separator">›</span><a href="/portfolio/">${escapeHtml(getLocalized(sectionText.portfolio, lang))}</a><span class="separator">›</span><span>${escapeHtml(title)}</span></div>
                    <h1>${escapeHtml(title)}</h1>
                    <p>${escapeHtml(summary)}</p>
                </div>
            </section>

            <section class="section section-white">
                <div class="container">
                    <div class="meta-grid fade-in">
                        <article class="meta-card">
                            <span class="meta-label">${escapeHtml(getLocalized(sectionText.client, lang))}</span>
                            <div class="meta-value">${escapeHtml(getLocalized(caseStudy.client, lang))}</div>
                        </article>
                        <article class="meta-card">
                            <span class="meta-label">${escapeHtml(getLocalized(sectionText.location, lang))}</span>
                            <div class="meta-value">${escapeHtml(getLocalized(caseStudy.location, lang))}</div>
                        </article>
                        <article class="meta-card">
                            <span class="meta-label">${escapeHtml(getLocalized(sectionText.sector, lang))}</span>
                            <div class="meta-value">${escapeHtml(getLocalized(caseStudy.sector, lang))}</div>
                        </article>
                        <article class="meta-card">
                            <span class="meta-label">${escapeHtml(getLocalized(sectionText.relatedService, lang))}</span>
                            <div class="meta-value">${escapeHtml(serviceName || getLocalized(categoryLabels[project.category], lang))}</div>
                        </article>
                    </div>
                </div>
            </section>

            <section class="section section-light">
                <div class="container">
                    <div class="detail-grid">
                        <article class="detail-card fade-in">
                            <span class="detail-kicker">${escapeHtml(getLocalized(sectionText.challenge, lang))}</span>
                            <h3>${escapeHtml(getLocalized(sectionText.projectContext, lang))}</h3>
                            <p>${escapeHtml(getLocalized(caseStudy.challenge, lang))}</p>
                        </article>
                        <article class="detail-card fade-in">
                            <span class="detail-kicker">${escapeHtml(getLocalized(sectionText.solution, lang))}</span>
                            <h3>${escapeHtml(getLocalized(sectionText.projectApproach, lang))}</h3>
                            <p>${escapeHtml(getLocalized(caseStudy.solution, lang))}</p>
                        </article>
                    </div>
                </div>
            </section>

            <section class="section section-white">
                <div class="container case-study-body">
                    <article class="case-study-section fade-in">
                        <span class="detail-kicker">${escapeHtml(getLocalized(sectionText.scope, lang))}</span>
                        <h2>${escapeHtml(getLocalized(sectionText.scope, lang))}</h2>
                        <ul>${renderListItems(getLocalized(caseStudy.scope, lang))}</ul>
                    </article>
                    <article class="case-study-section fade-in">
                        <span class="detail-kicker">${escapeHtml(getLocalized(sectionText.outcome, lang))}</span>
                        <h2>${escapeHtml(getLocalized(sectionText.outcome, lang))}</h2>
                        <p>${escapeHtml(getLocalized(caseStudy.outcome, lang))}</p>
                        ${serviceSlug ? renderDetailLink(`/services/${serviceSlug}/`, getLocalized(sectionText.exploreService, lang)) : ''}
                    </article>
                </div>
            </section>

            <section class="section section-light">
                <div class="container">
                    <div class="section-header center fade-in">
                        <div class="section-label">${escapeHtml(getLocalized(sectionText.featuredLabel, lang))}</div>
                        <h2 class="section-title">${escapeHtml(getLocalized(sectionText.gallery, lang))}</h2>
                    </div>
                    <div class="gallery-grid fade-in">${galleryImages}</div>
                </div>
            </section>

            <section class="cta-section">
                <div class="container fade-in">
                    <h2>${escapeHtml(getLocalized(sectionText.discussProject, lang))}</h2>
                    <p>${escapeHtml(getLocalized(sectionText.discussProjectDesc, lang))}</p>
                    <a href="/contact/" class="btn btn-primary">${escapeHtml(getLocalized(sectionText.discussProject, lang))} <span aria-hidden="true">›</span></a>
                </div>
            </section>
        `
    });
};

// ============================================================
// STRUCTURED DATA
// ============================================================
const buildBreadcrumbData = (slug, lang, pageName) => {
    if (!slug) return null;

    const segments = slug.split('/').filter(Boolean);
    const topLevelNames = {
        about: { en: 'About Us', id: 'Tentang Kami' },
        services: { en: 'Services', id: 'Layanan' },
        portfolio: { en: 'Portfolio', id: 'Portofolio' },
        contact: { en: 'Contact', id: 'Kontak' },
        team: { en: 'Team', id: 'Tim' }
    };

    const elements = [{
        '@type': 'ListItem',
        position: 1,
        name: getLocalized(sectionText.home, lang),
        item: buildUrls('', lang)
    }];

    let accum = '';
    segments.forEach((segment, index) => {
        accum = accum ? `${accum}/${segment}` : segment;
        const isLast = index === segments.length - 1;
        const name = isLast ? pageName : (getLocalized(topLevelNames[segment], lang) || segment.replace(/-/g, ' '));
        elements.push({
            '@type': 'ListItem',
            position: elements.length + 1,
            name,
            item: buildUrls(accum, lang)
        });
    });

    return {
        '@type': 'BreadcrumbList',
        itemListElement: elements
    };
};

const buildStructuredData = ({ slug, lang, title, description, pageName }) => {
    const pageUrl = buildUrls(slug, lang);
    const segments = slug.split('/').filter(Boolean);
    const relatedService = segments[0] === 'portfolio' ? relatedServiceByCaseFolder.get(segments[1]) : null;
    const caseStudy = segments[0] === 'portfolio' ? caseStudiesByFolder.get(segments[1]) : null;
    const serviceDetail = segments[0] === 'services' && segments[1] ? serviceDetailsBySlug.get(segments[1]) : null;
    const service = segments[0] === 'services' && segments[1] ? servicesBySlug.get(segments[1]) : null;

    const businessNode = {
        '@type': 'LocalBusiness',
        '@id': `${BASE_URL}#business`,
        name: 'PT. Globalindo Simetrika',
        url: BASE_URL,
        image: `${BASE_URL}/images/office.jpg`,
        logo: `${BASE_URL}/images/logo.webp`,
        email: seoContent.business.email,
        address: {
            '@type': 'PostalAddress',
            ...seoContent.business.address
        },
        areaServed: seoContent.business.areaServed
    };

    if (businessTelephone) {
        businessNode.telephone = businessTelephone;
        businessNode.contactPoint = {
            '@type': 'ContactPoint',
            telephone: businessTelephone,
            email: seoContent.business.email,
            contactType: 'customer service',
            availableLanguage: ['Indonesian', 'English']
        };
    }

    const graph = [businessNode];

    if (!slug) {
        graph.unshift({
            '@type': 'WebSite',
            '@id': `${BASE_URL}#website`,
            url: BASE_URL,
            name: 'PT. Globalindo Simetrika',
            inLanguage: lang
        });
    }

    if (slug === 'contact') {
        graph.push({
            '@type': 'ContactPage',
            '@id': `${pageUrl}#page`,
            url: pageUrl,
            name: pageName,
            description,
            mainEntity: { '@id': `${BASE_URL}#business` },
            inLanguage: lang
        });
    }

    if (serviceDetail && service) {
        graph.push({
            '@type': 'Service',
            '@id': `${pageUrl}#service`,
            name: getLocalized(service.name, lang),
            serviceType: getLocalized(service.name, lang),
            description: getLocalized(serviceDetail.summary, lang),
            provider: { '@id': `${BASE_URL}#business` },
            areaServed: seoContent.business.areaServed
        });
    }

    if (caseStudy) {
        const project = projectsByFolder.get(segments[1]);
        graph.push({
            '@type': 'Article',
            '@id': `${pageUrl}#case-study`,
            headline: pageName,
            description,
            mainEntityOfPage: pageUrl,
            author: { '@id': `${BASE_URL}#business` },
            publisher: { '@id': `${BASE_URL}#business` },
            image: (project?.images || []).slice(0, 4).map((file) => `${BASE_URL}${rootRelativeImage(project.folder, file)}`),
            about: [
                getLocalized(caseStudy.sector, lang),
                relatedService ? getLocalized(servicesBySlug.get(relatedService)?.name, lang) : undefined
            ].filter(Boolean)
        });
    }

    const breadcrumb = buildBreadcrumbData(slug, lang, pageName);
    if (breadcrumb) graph.push(breadcrumb);

    return `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': graph
    })}</script>`;
};

// ============================================================
// HTML PROCESSING
// ============================================================
const injectStaticSections = ($, slug, lang) => {
    if (slug === 'services') {
        $('#dynamic-services-container').html(renderServiceCards(lang));
        $('#service-detail-sections-placeholder').replaceWith(renderServiceDetailSections(lang));
        $('#service-faq-placeholder').replaceWith(renderServiceFaqSection(lang));
    }

    if (slug === 'portfolio') {
        $('#portfolio-grid').html(portfolioCatalog.projects.map((project) => renderPortfolioCard(project, lang)).join(''));
        $('#portfolio-timeline').html(renderPortfolioTimeline());
        $('#featured-case-studies-placeholder').replaceWith(renderFeaturedCaseStudiesSection(lang));
    }
};

const renderPageForLang = (relPath, originalHtml, lang) => {
    const slug = pageSlugFromRelPath(relPath);
    const $ = cheerio.load(originalHtml);

    $('#navbar-placeholder').replaceWith(navbarRaw);
    $('#footer-placeholder').replaceWith(footerRaw);
    $('html').attr('lang', lang);

    injectStaticSections($, slug, lang);

    $('script[src*="i18n.js"]').remove();

    $('[data-i18n]').each((_, el) => {
        const key = $(el).attr('data-i18n');
        if (translations[key]?.[lang]) $(el).text(translations[key][lang]);
        $(el).removeAttr('data-i18n');
    });

    $('[data-i18n-html]').each((_, el) => {
        const key = $(el).attr('data-i18n-html');
        if (translations[key]?.[lang]) $(el).html(translations[key][lang]);
        $(el).removeAttr('data-i18n-html');
    });

    $('[data-i18n-placeholder]').each((_, el) => {
        const key = $(el).attr('data-i18n-placeholder');
        if (translations[key]?.[lang]) $(el).attr('placeholder', translations[key][lang]);
        $(el).removeAttr('data-i18n-placeholder');
    });

    $('[data-i18n-attr]').each((_, el) => {
        const spec = $(el).attr('data-i18n-attr');
        const colonIdx = spec.indexOf(':');
        if (colonIdx === -1) return;
        const attr = spec.substring(0, colonIdx);
        const key = spec.substring(colonIdx + 1);
        if (translations[key]?.[lang]) $(el).attr(attr, translations[key][lang]);
        $(el).removeAttr('data-i18n-attr');
    });

    $('link[rel="canonical"]').attr('href', buildUrls(slug, lang));
    $('meta[property="og:url"]').attr('content', buildUrls(slug, lang));
    $('meta[property="twitter:url"]').attr('content', buildUrls(slug, lang));

    const hreflangTags = LANGS.map((targetLang) =>
        `<link rel="alternate" hreflang="${targetLang}" href="${buildUrls(slug, targetLang)}">`
    ).join('\n  ');
    const xDefault = `<link rel="alternate" hreflang="x-default" href="${buildUrls(slug, DEFAULT_LANG)}">`;
    $('head').html($('head').html().replace('<!-- HREFLANG_PLACEHOLDER -->', `${hreflangTags}\n  ${xDefault}`));

    $('[data-lang]').each((_, el) => {
        const targetLang = $(el).attr('data-lang');
        $(el).attr('href', buildRelativeUrl(slug, targetLang));
        $(el).toggleClass('active', targetLang === lang);
    });

    const currentTitle = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    const pageName = currentTitle.split(' | ')[0].trim();
    $('head').append(buildStructuredData({ slug, lang, title: currentTitle, description, pageName }));

    const assetPrefixes = ['/css/', '/js/', '/images/', '/parts/', '/fonts/'];
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || $(el).attr('data-lang')) {
            return;
        }

        if (href.startsWith('/')) {
            if (assetPrefixes.some((prefix) => href.startsWith(prefix))) return;
            if (href.startsWith('/en/') || href.startsWith('/id/')) return;
            $(el).attr('href', `/${lang}${href}`);
        }
    });

    const assetDirs = ['css/', 'js/', 'images/', 'data/', 'fonts/'];
    const makeAbsolute = (val) => {
        if (!val) return val;
        if (val.startsWith('http') || val.startsWith('/') || val.startsWith('#')) return val;

        for (const dir of assetDirs) {
            const idx = val.indexOf(dir);
            if (idx !== -1) return `/${val.substring(idx)}`;
        }
        return val;
    };

    $('link[href]').each((_, el) => $(el).attr('href', makeAbsolute($(el).attr('href'))));
    $('script[src]').each((_, el) => $(el).attr('src', makeAbsolute($(el).attr('src'))));
    $('img[src]').each((_, el) => $(el).attr('src', makeAbsolute($(el).attr('src'))));
    $('[data-image]').each((_, el) => {
        const val = $(el).attr('data-image');
        if (!val) return;
        const mapped = val.split(',').map((segment) => makeAbsolute(segment.trim())).join(', ');
        $(el).attr('data-image', mapped);
    });

    const destPath = path.join(DIST_DIR, lang, relPath);
    mkdirp(path.dirname(destPath));
    fs.writeFileSync(destPath, $.html(), 'utf8');
    console.log(`  [${lang}] ${relPath}`);
};

const renderPage = (relPath, originalHtml) => {
    LANGS.forEach((lang) => renderPageForLang(relPath, originalHtml, lang));
};

// ============================================================
// SITEMAP
// ============================================================
const generateSitemap = (relPaths) => {
    const today = new Date().toISOString().split('T')[0];
    const urls = [`  <url>\n    <loc>${BASE_URL}/en/</loc>\n    <lastmod>${today}</lastmod>\n    <priority>1.0</priority>\n  </url>`];

    relPaths.forEach((relPath) => {
        if (relPath.startsWith('parts/')) return;
        const slug = pageSlugFromRelPath(relPath);
        if (slug === '') return;

        LANGS.forEach((lang) => {
            const priority = slug.startsWith('services/') || slug.startsWith('portfolio/') ? '0.7' : (lang === DEFAULT_LANG ? '0.8' : '0.6');
            urls.push(`  <url>\n    <loc>${buildUrls(slug, lang)}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`);
        });
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap, 'utf8');
    console.log('\n  [sitemap] dist/sitemap.xml');
};

// ============================================================
// MAIN
// ============================================================
console.log('=== Globalindo SSG Build ===\n');
console.log('Copying assets...');
copyAssets(SRC_DIR, DIST_DIR);

console.log('\nProcessing HTML templates...');
const sourceHtmlFiles = [];

const collectHtml = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectHtml(full);
        } else if (entry.name.endsWith('.html')) {
            sourceHtmlFiles.push(path.relative(SRC_DIR, full));
        }
    }
};

collectHtml(SRC_DIR);

sourceHtmlFiles.forEach((relPath) => {
    if (relPath.startsWith('parts/')) return;
    renderPage(relPath, fs.readFileSync(path.join(SRC_DIR, relPath), 'utf8'));
});

const generatedRelPaths = [];

servicesCatalog.forEach((service) => {
    const detail = serviceDetailsBySlug.get(service.slug);
    if (!detail) return;
    const relPath = `services/${service.slug}/index.html`;
    generatedRelPaths.push(relPath);
    LANGS.forEach((lang) => {
        renderPageForLang(relPath, renderServiceDetailPage(service, detail, lang), lang);
    });
});

seoContent.featuredCaseStudies.forEach((caseStudy) => {
    const project = projectsByFolder.get(caseStudy.folder);
    if (!project) return;
    const relPath = `portfolio/${caseStudy.folder}/index.html`;
    generatedRelPaths.push(relPath);
    LANGS.forEach((lang) => {
        renderPageForLang(relPath, renderCaseStudyPage(project, caseStudy, relatedServiceByCaseFolder.get(caseStudy.folder), lang), lang);
    });
});

console.log('\nGenerating sitemap...');
generateSitemap([...sourceHtmlFiles, ...generatedRelPaths]);

console.log('\n✓ Build completed successfully!\n');
