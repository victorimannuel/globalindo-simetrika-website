import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

// ============================================================
// CONFIG
// ============================================================
const SRC_DIR   = './src';
const DIST_DIR  = './dist';
const LANGS     = ['en', 'id'];
const BASE_URL  = 'https://globalindosimetrika.co.id';
const DEFAULT_LANG = 'en';

// ============================================================
// HELPERS
// ============================================================
const mkdirp = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

/** Recursively copy all non-HTML files from src → dest */
const copyAssets = (src, dest) => {
    mkdirp(dest);
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath  = path.join(src,  entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyAssets(srcPath, destPath);
        } else if (!entry.name.endsWith('.html')) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

/** Derive the page slug from the relative src path.
 *  e.g. "index.html" → ""  |  "about/index.html" → "about" */
const pageSlugFromRelPath = (relPath) => {
    const dir = path.dirname(relPath); // "." or "about"
    return dir === '.' ? '' : dir;     // "" or "about"
};

/** Build canonical + hreflang URLs for a slug + lang */
const buildUrls = (slug, lang) => {
    const suffix = slug ? `${lang}/${slug}/` : `${lang}/`;
    return `${BASE_URL}/${suffix}`;
};

// ============================================================
// LOAD TRANSLATIONS
// ============================================================
const i18nContent = fs.readFileSync(path.join(SRC_DIR, 'js', 'i18n.js'), 'utf8');
const i18nMatch   = i18nContent.match(/const translations = ({[\s\S]+?});/);
if (!i18nMatch) { console.error('ERROR: Could not parse translations from i18n.js'); process.exit(1); }
const translations = eval('(' + i18nMatch[1] + ')');

// ============================================================
// LOAD PARTIALS
// ============================================================
const navbarRaw = fs.readFileSync(path.join(SRC_DIR, 'parts', 'navbar.html'), 'utf8');
const footerRaw = fs.readFileSync(path.join(SRC_DIR, 'parts', 'footer.html'), 'utf8');

// ============================================================
// PROCESS A SINGLE HTML FILE
// ============================================================
const processHtmlFile = (srcPath) => {
    const relPath = path.relative(SRC_DIR, srcPath);

    // Skip partial templates – they are injected, not standalone pages
    if (relPath.startsWith('parts/')) return;

    const slug        = pageSlugFromRelPath(relPath);
    const originalHtml = fs.readFileSync(srcPath, 'utf8');

    LANGS.forEach((lang) => {
        const $ = cheerio.load(originalHtml);

        // --------------------------------------------------
        // 1. Inject partials (navbar + footer)
        // --------------------------------------------------
        $('#navbar-placeholder').replaceWith(navbarRaw);
        $('#footer-placeholder').replaceWith(footerRaw);

        // --------------------------------------------------
        // 2. Set <html lang="…">
        // --------------------------------------------------
        $('html').attr('lang', lang);

        // --------------------------------------------------
        // 3. Remove client-side i18n script (no longer needed)
        // --------------------------------------------------
        $('script[src*="i18n.js"]').remove();

        // --------------------------------------------------
        // 4. Translate text nodes  [data-i18n]
        // --------------------------------------------------
        $('[data-i18n]').each((_, el) => {
            const key = $(el).attr('data-i18n');
            if (translations[key]?.[lang]) $(el).text(translations[key][lang]);
            $(el).removeAttr('data-i18n');
        });

        // --------------------------------------------------
        // 5. Translate inner HTML  [data-i18n-html]
        // --------------------------------------------------
        $('[data-i18n-html]').each((_, el) => {
            const key = $(el).attr('data-i18n-html');
            if (translations[key]?.[lang]) $(el).html(translations[key][lang]);
            $(el).removeAttr('data-i18n-html');
        });

        // --------------------------------------------------
        // 6. Translate placeholder text  [data-i18n-placeholder]
        // --------------------------------------------------
        $('[data-i18n-placeholder]').each((_, el) => {
            const key = $(el).attr('data-i18n-placeholder');
            if (translations[key]?.[lang]) $(el).attr('placeholder', translations[key][lang]);
            $(el).removeAttr('data-i18n-placeholder');
        });

        // --------------------------------------------------
        // 7. Translate generic attributes  [data-i18n-attr="attr:key"]
        //    e.g.  data-i18n-attr="content:meta.desc.home"
        // --------------------------------------------------
        $('[data-i18n-attr]').each((_, el) => {
            const spec = $(el).attr('data-i18n-attr'); // "content:meta.desc.home"
            const colonIdx = spec.indexOf(':');
            if (colonIdx === -1) return;
            const attr = spec.substring(0, colonIdx);
            const key  = spec.substring(colonIdx + 1);
            if (translations[key]?.[lang]) $(el).attr(attr, translations[key][lang]);
            $(el).removeAttr('data-i18n-attr');
        });

        // --------------------------------------------------
        // 8. SEO – Fix canonical URL
        // --------------------------------------------------
        const canonicalUrl = buildUrls(slug, lang);
        $('link[rel="canonical"]').attr('href', canonicalUrl);

        // --------------------------------------------------
        // 9. SEO – Inject hreflang alternate links
        //    Replace <!-- HREFLANG_PLACEHOLDER --> comment
        // --------------------------------------------------
        const hreflangTags = LANGS.map(l =>
            `<link rel="alternate" hreflang="${l}" href="${buildUrls(slug, l)}">`
        ).join('\n  ');
        // x-default points to the default language version
        const xDefault = `<link rel="alternate" hreflang="x-default" href="${buildUrls(slug, DEFAULT_LANG)}">`;
        const allHreflang = `${hreflangTags}\n  ${xDefault}`;

        // Replace the comment node with actual tags
        $('head').html(
            $('head').html().replace('<!-- HREFLANG_PLACEHOLDER -->', allHreflang)
        );

        // --------------------------------------------------
        // 10. Rewrite lang toggle buttons (data-lang)
        // --------------------------------------------------
        $('[data-lang]').each((_, el) => {
            const targetLang = $(el).attr('data-lang');
            const toggleUrl  = `/${buildUrls(slug, targetLang).replace(BASE_URL + '/', '')}`;
            $(el).attr('href', toggleUrl);
            if (targetLang === lang) {
                $(el).addClass('active');
            } else {
                $(el).removeClass('active');
            }
        });

        // --------------------------------------------------
        // 11. Rewrite internal nav links  (a[href] starting with /)
        //     Prepend /{lang} to paths that are not static assets
        // --------------------------------------------------
        const ASSET_PREFIXES = ['/css/', '/js/', '/images/', '/parts/', '/fonts/'];
        $('a[href]').each((_, el) => {
            let href = $(el).attr('href');
            // Skip external, anchors, mailto, tel, and already-rewritten lang-toggle links
            if (!href || href.startsWith('http') || href.startsWith('#') ||
                href.startsWith('mailto:') || href.startsWith('tel:') ||
                $(el).attr('data-lang')) return;

            if (href.startsWith('/')) {
                // Skip static asset paths
                if (ASSET_PREFIXES.some(p => href.startsWith(p))) return;
                // Skip if already has a lang prefix (defensive)
                if (href.startsWith('/en/') || href.startsWith('/id/')) return;
                $(el).attr('href', `/${lang}${href}`);
            }
        });

        // --------------------------------------------------
        // 12. Write output file
        // --------------------------------------------------
        const destPath = path.join(DIST_DIR, lang, relPath);
        mkdirp(path.dirname(destPath));
        fs.writeFileSync(destPath, $.html(), 'utf8');

        console.log(`  [${lang}] ${relPath}`);
    });
};

// ============================================================
// GENERATE SITEMAP
// ============================================================
const generateSitemap = (htmlFiles) => {
    const today = new Date().toISOString().split('T')[0];
    const urls = [];

    // Root redirect (canonical to /en/)
    urls.push(`  <url>\n    <loc>${BASE_URL}/en/</loc>\n    <lastmod>${today}</lastmod>\n    <priority>1.0</priority>\n  </url>`);

    for (const relPath of htmlFiles) {
        if (relPath.startsWith('parts/')) continue;
        const slug = pageSlugFromRelPath(relPath);
        if (slug === '') continue; // already added root above

        for (const lang of LANGS) {
            const url = buildUrls(slug, lang);
            const priority = lang === DEFAULT_LANG ? '0.8' : '0.6';
            urls.push(`  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`);
        }
    }

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
const allHtmlFiles = [];

const collectHtml = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectHtml(full);
        } else if (entry.name.endsWith('.html')) {
            allHtmlFiles.push(path.relative(SRC_DIR, full));
        }
    }
};
collectHtml(SRC_DIR);

for (const relPath of allHtmlFiles) {
    const fullPath = path.join(SRC_DIR, relPath);
    if (!relPath.startsWith('parts/')) {
        processHtmlFile(fullPath);
    }
}

console.log('\nGenerating sitemap...');
generateSitemap(allHtmlFiles);

console.log('\n✓ Build completed successfully!\n');
