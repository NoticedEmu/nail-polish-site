/* =========================================================
   Shared Javascript
   ========================================================= */

// Update this value when you want browsers to force-refresh JSON files.
const SITE_DATA_VERSION = '2026-06-30-image-loading';

async function fetchPolishData() {
    const response = await fetch(`data.json?v=${SITE_DATA_VERSION}`);

    if (!response.ok) {
        throw new Error(`Failed to load data.json: ${response.status}`);
    }

    const rawData = await response.json();
    return Array.isArray(rawData) ? rawData.map(normalizePolishEntry) : [];
}

function getFirstMeaningfulValue(...values) {
    for (const value of values) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) return trimmed;
            continue;
        }

        if (value !== null && value !== undefined && value !== '') {
            return value;
        }
    }

    return '';
}

function normalizeAssetPath(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';

    // Keep image paths as close to data.json as possible.
    // GitHub Pages is case-sensitive, and encoding/case-normalizing local file paths
    // can break thumbnails when file or folder names contain punctuation.
    return raw
        .replaceAll('\\', '/')
        .replaceAll('&amp;', '&')
        .replace(/^\.\//, '')
        .trim();
}

function normalizePolishEntry(entry = {}) {
    const brand = getFirstMeaningfulValue(entry.brand, entry.Brand);
    const name = getFirstMeaningfulValue(entry.name, entry.Nailpolish, entry['Nail Polish']);
    const filename = getFirstMeaningfulValue(entry.filename, entry.Filename);

    const thumb = normalizeAssetPath(
        getFirstMeaningfulValue(entry.thumb, entry.Thumb, entry['thumb'])
    );

    const imageOne = normalizeAssetPath(
        getFirstMeaningfulValue(
            entry.imageOne,
            entry['image one'],
            entry.image1,
            entry['image 1'],
            entry.image
        )
    );

    const imageTwo = normalizeAssetPath(
        getFirstMeaningfulValue(
            entry.imageTwo,
            entry['image two'],
            entry.image2,
            entry['image 2']
        )
    );

    const imageThree = normalizeAssetPath(
        getFirstMeaningfulValue(
            entry.imageThree,
            entry['image three'],
            entry.image3,
            entry['image 3']
        )
    );

    return {
        ...entry,
        brand,
        Brand: brand,
        name,
        Nailpolish: name,
        filename,
        Filename: filename,
        thumb,
        image: imageOne || thumb,
        imageOne,
        imageTwo,
        imageThree,
        color: getFirstMeaningfulValue(entry.color, entry.Color),
        type: getFirstMeaningfulValue(entry.type, entry.Type),
        subtype: getFirstMeaningfulValue(
            entry.subtype,
            entry.subType,
            entry['sub type'],
            entry.Subtype,
            entry['Sub Type']
        ),
        number: getFirstMeaningfulValue(entry.number, entry.Number),
        description: getFirstMeaningfulValue(
            entry.description,
            entry.Description,
            entry.desc,
            entry.details,
            entry.notes
        ),
        region: getFirstMeaningfulValue(entry.region, entry.Region),
        local: getFirstMeaningfulValue(entry.local, entry.Local),
        hasDupes: getFirstMeaningfulValue(entry.hasDupes, entry['Has Dupes']),
        dupeGroup: getFirstMeaningfulValue(entry.dupeGroup, entry['Dupe Group'])
    };
}

/* ===== UTILITIES ===== */

function getUniqueValues(data, key) {
    return [...new Set(
        data
            .map(item => (item[key] ?? '').toString().trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
}

function escapeHTML(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function hasMeaningfulValue(value) {
    return String(value ?? '').trim() !== '';
}

/* ===== BADGES ===== */

function getBadgeClass(type) {
    const normalized = (type || '').trim().toLowerCase();

    if (normalized === 'magnetic') return 'badge-magnetic';
    if (normalized === 'holographic') return 'badge-holographic';
    if (normalized === 'thermal') return 'badge-thermal';
    if (normalized === 'flakie') return 'badge-flakie';
    if (normalized === 'crackle') return 'badge-crackle';
    if (normalized === 'reflective glitter') return 'badge-reflective-glitter';
    if (normalized === 'topper') return 'badge-topper';

    return 'badge-other';
}

function getTooltipClass(type) {
    const normalized = (type || '').trim().toLowerCase();

    if (normalized === 'magnetic') return 'tooltip-magnetic';
    if (normalized === 'holographic') return 'tooltip-holographic';
    if (normalized === 'thermal') return 'tooltip-thermal';
    if (normalized === 'flakie') return 'tooltip-flakie';
    if (normalized === 'crackle') return 'tooltip-crackle';
    if (normalized === 'reflective glitter') return 'tooltip-reflective-glitter';
    if (normalized === 'topper') return 'tooltip-topper';

    return 'tooltip-other';
}

function createNumberBadge(type, number) {
    if (!hasMeaningfulValue(number)) {
        return '<span>—</span>';
    }

    return `
    <span class="number-badge-wrap">
      <span class="number-badge ${getBadgeClass(type)}">${escapeHTML(number)}</span>
      <span class="badge-tooltip ${getTooltipClass(type)}">${escapeHTML(type || '')}</span>
    </span>
  `;
}

/* ===== SHARED PAGE NAV ===== */

async function fetchSitePages() {
    const response = await fetch(`pages.json?v=${SITE_DATA_VERSION}`);

    if (!response.ok) {
        throw new Error(`Failed to load pages.json: ${response.status}`);
    }

    const pages = await response.json();
    return Array.isArray(pages) ? pages : [];
}

function normalizePagePath(path) {
    const value = String(path || '').trim();
    if (!value) return '';

    const withoutHash = value.split('#')[0];
    const withoutQuery = withoutHash.split('?')[0];

    return withoutQuery
        .replace(/^\.?\//, '')
        .toLowerCase();
}

function getCurrentPagePath() {
    const pathname = window.location.pathname || '';
    const fileName = pathname.split('/').pop() || 'index.html';
    return normalizePagePath(fileName);
}

function createPageMenuLink(page, currentPage = '') {
    const safeHref = escapeHTML(page.href || '#');
    const safeTitle = escapeHTML(page.title || '');
    const hrefPath = normalizePagePath(page.href);
    const activeClass = hrefPath === currentPage ? ' class="is-active" aria-current="page"' : '';
    const sparkle = page.sparkle ? ' <span class="lucky-sparkle">✨</span>' : '';

    return `<a href="${safeHref}"${activeClass}>${safeTitle}${sparkle}</a>`;
}

function createStatsIconSvg() {
    return `
        <svg class="stats-bar-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path class="stats-bar-icon-baseline" d="M4.5 20h15"></path>
            <rect class="stats-bar-icon-bar" x="6" y="12" width="3.2" height="8" rx="1.2"></rect>
            <rect class="stats-bar-icon-bar" x="10.4" y="8" width="3.2" height="12" rx="1.2"></rect>
            <rect class="stats-bar-icon-bar" x="14.8" y="4" width="3.2" height="16" rx="1.2"></rect>
        </svg>
    `;
}

function updateStatsIconButton() {
    document.querySelectorAll('.stats-icon-button').forEach(statsButton => {
        statsButton.innerHTML = createStatsIconSvg();
    });
}

function initializeTopActionButtons() {
    const pageShell = document.querySelector('.page-shell');
    if (!pageShell) return;

    const topbar = pageShell.querySelector('.directory-topbar, .lucky-page-topbar, .dupes-page-topbar, .moods-page-topbar, .stats-page-topbar');
    if (!topbar) return;

    topbar.classList.add('site-topbar');

    const isDirectoryTopbar = topbar.classList.contains('directory-topbar');

    let actions = topbar.querySelector('.directory-actions, .site-top-actions');
    if (!actions) {
        actions = document.createElement('div');
        actions.className = 'site-top-actions';
        topbar.appendChild(actions);
    } else {
        actions.classList.add('site-top-actions');
    }

    if (isDirectoryTopbar) {
        const searchToggleWrap = document.querySelector('.search-toggle-wrap');
        if (searchToggleWrap && !actions.contains(searchToggleWrap)) {
            actions.insertBefore(searchToggleWrap, actions.firstChild);
        }

        if (!actions.querySelector('.add-polish-button')) {
            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'add-polish-button';
            addButton.innerHTML = '<span aria-hidden="true">＋</span> Add Polish';
            addButton.addEventListener('click', () => {
                alert('Add Polish is set up as a placeholder for now. A future add.html page or form can be connected here.');
            });
            actions.appendChild(addButton);
        }
    }

    if (!actions.querySelector('.stats-icon-button')) {
        const statsButton = document.createElement('a');
        statsButton.className = 'stats-icon-button';
        statsButton.href = 'stats.html';
        statsButton.setAttribute('aria-label', 'Open polish stats');
        statsButton.setAttribute('title', 'Open polish stats');
        statsButton.innerHTML = createStatsIconSvg();
        actions.appendChild(statsButton);
    }

    updateStatsIconButton();
}

async function initializeSharedPagesMenu() {
    const menus = document.querySelectorAll('.pages-dropdown-menu');
    if (!menus.length) {
        initializeTopActionButtons();
        return;
    }

    try {
        const pages = await fetchSitePages();
        const currentPage = getCurrentPagePath();

        const visiblePages = pages.filter(page => {
            const hrefPath = normalizePagePath(page.href);
            return hrefPath && hrefPath !== currentPage && hrefPath !== 'stats.html';
        });

        menus.forEach(menu => {
            menu.innerHTML = visiblePages
                .map(page => `<li>${createPageMenuLink(page, currentPage)}</li>`)
                .join('');
        });

        document.querySelectorAll('.pages-dropdown').forEach(nav => {
            nav.classList.add('site-nav');

            const toggle = nav.querySelector('.pages-dropdown-toggle');
            const menu = nav.querySelector('.pages-dropdown-menu');

            if (toggle && menu && !toggle.dataset.menuBound) {
                toggle.dataset.menuBound = 'true';
                toggle.setAttribute('aria-expanded', 'false');

                toggle.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();

                    const isOpen = nav.classList.toggle('is-open');
                    toggle.setAttribute('aria-expanded', String(isOpen));
                });

                menu.addEventListener('click', event => {
                    event.stopPropagation();
                });
            }
        });

        if (!document.documentElement.dataset.sharedMenuCloseBound) {
            document.documentElement.dataset.sharedMenuCloseBound = 'true';
            document.addEventListener('click', () => {
                document.querySelectorAll('.pages-dropdown.is-open').forEach(nav => {
                    nav.classList.remove('is-open');
                    const toggle = nav.querySelector('.pages-dropdown-toggle');
                    if (toggle) toggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        initializeTopActionButtons();
    } catch (error) {
        console.error('Unable to initialize shared pages menu:', error);
        initializeTopActionButtons();
    }
}

function updateSharedPagesMenuLink(hrefMatch, newHref) {
    const links = document.querySelectorAll('.pages-dropdown-menu a');

    links.forEach(link => {
        if (normalizePagePath(link.getAttribute('href')) === normalizePagePath(hrefMatch)) {
            link.setAttribute('href', newHref);
        }
    });
}

/* ===== FILTER HELPERS ===== */

function populateSelect(selectElement, values, defaultLabel) {
    selectElement.innerHTML = `<option value="">${defaultLabel}</option>`;

    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    });
}


function normalizeColorLabel(value, fallback = 'Unknown') {
    const text = String(value ?? '').trim();
    return text || fallback;
}

function getColorFamily(rawColor) {
    const color = normalizeColorLabel(rawColor).toLowerCase();

    const familyMatchers = [
        { family: 'Red', keywords: ['red', 'wine', 'burgundy', 'berry', 'cranberry', 'maroon', 'ruby', 'garnet', 'scarlet', 'rosewood', 'mahogany', 'oxblood'] },
        { family: 'Pink', keywords: ['pink', 'mauve', 'rose', 'blush', 'fuchsia', 'magenta', 'hot pink', 'dusty rose'] },
        { family: 'Orange', keywords: ['orange', 'coral', 'tangerine', 'apricot', 'peach', 'rust', 'copper', 'terracotta', 'burnt orange'] },
        { family: 'Yellow', keywords: ['yellow', 'gold', 'mustard', 'lemon', 'chartreuse', 'amber', 'honey'] },
        { family: 'Green', keywords: ['green', 'emerald', 'olive', 'mint', 'sage', 'lime', 'forest', 'seafoam', 'avocado', 'moss', 'jade'] },
        { family: 'Teal', keywords: ['teal', 'turquoise', 'aqua', 'cyan', 'blue-green', 'sea glass'] },
        { family: 'Blue', keywords: ['blue', 'navy', 'denim', 'cobalt', 'indigo', 'periwinkle', 'sky', 'cerulean'] },
        { family: 'Purple', keywords: ['purple', 'plum', 'violet', 'lavender', 'lilac', 'orchid', 'eggplant', 'grape'] },
        { family: 'Brown', keywords: ['brown', 'taupe', 'mocha', 'chocolate', 'espresso', 'caramel', 'tan', 'beige', 'nude'] },
        { family: 'Gray', keywords: ['gray', 'grey', 'charcoal', 'slate', 'silver', 'smoke', 'gunmetal'] },
        { family: 'Black', keywords: ['black'] },
        { family: 'White', keywords: ['white', 'ivory', 'cream'] },
        { family: 'Clear', keywords: ['clear', 'transparent'] }
    ];

    for (const matcher of familyMatchers) {
        if (matcher.keywords.some(keyword => color.includes(keyword))) {
            return matcher.family;
        }
    }

    return 'Other';
}

function getColorFamilyOptions(data) {
    const familyOrder = ['Red', 'Pink', 'Orange', 'Yellow', 'Green', 'Teal', 'Blue', 'Purple', 'Brown', 'Gray', 'Black', 'White', 'Clear', 'Other'];
    const presentFamilies = new Set(
        data
            .map(item => getColorFamily(item.color))
            .filter(Boolean)
    );

    return familyOrder.filter(family => presentFamilies.has(family));
}

function getQueryParams() {
    return new URLSearchParams(window.location.search);
}

function buildDirectoryUrl(color, type) {
    const params = new URLSearchParams();

    if (color) params.set('color', color);
    if (type) params.set('type', type);

    const query = params.toString();
    return query ? `index.html?${query}` : 'index.html';
}

/* ===== DATA HELPERS ===== */

function getPolishKey(polish) {
    return [
        polish.brand || '',
        polish.name || '',
        polish.color || '',
        polish.type || '',
        polish.subtype || '',
        polish.number ?? '',
        polish.image || '',
        polish.thumb || ''
    ].join('||');
}

function shuffleArray(items) {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

/* ===== OPTIONAL FIELDS ===== */

function getPolishSubtype(polish) {
    return String(polish?.subtype ?? '').trim();
}

function getPolishDescription(polish) {
    const description =
        polish?.description ??
        polish?.desc ??
        polish?.details ??
        polish?.notes ??
        '';

    return String(description ?? '').trim();
}

/* ===== GALLERY SUPPORT ===== */

function getPolishGallery(polish) {
    const gallery = [];
    const seen = new Set();
    const normalizedPolish = normalizePolishEntry(polish);
    const fallbackThumb = normalizedPolish?.thumb || '';

    function isLikelyImagePath(path) {
        const value = String(path ?? '').trim();
        return /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(value);
    }

    function add(entry, options = {}) {
        if (!entry) return;

        let src = '';
        let thumb = '';
        let alt = '';

        if (typeof entry === 'string') {
            src = normalizeAssetPath(entry);
            thumb = options.useFallbackThumb ? fallbackThumb : src;
        } else if (typeof entry === 'object') {
            src = normalizeAssetPath(
                entry.src ??
                entry.image ??
                entry.url ??
                entry['image one'] ??
                entry.imageOne ??
                ''
            );

            thumb = normalizeAssetPath(entry.thumb ?? entry.Thumb ?? (options.useFallbackThumb ? fallbackThumb : src));
            alt = String(entry.alt ?? '').trim();
        }

        if (!src || !isLikelyImagePath(src) || seen.has(src)) return;
        seen.add(src);

        gallery.push({
            src,
            thumb: isLikelyImagePath(thumb) ? thumb : src,
            alt
        });
    }

    // Only real gallery/full-size image fields should create next/previous image slots.
    // The thumbnail is used for previews, but it should not become an extra blank/low-res slide.
    [
        ...(Array.isArray(normalizedPolish?.gallery) ? normalizedPolish.gallery : []),
        normalizedPolish?.imageOne,
        normalizedPolish?.imageTwo,
        normalizedPolish?.imageThree
    ].forEach(entry => add(entry, { useFallbackThumb: true }));

    // Support older data that only has `image`, but avoid adding the thumbnail as a duplicate slide.
    if (normalizedPolish?.image && normalizedPolish.image !== fallbackThumb) {
        add(normalizedPolish.image, { useFallbackThumb: true });
    }

    // If a polish truly has no full-size image, fall back to its thumbnail as the only image.
    if (!gallery.length && fallbackThumb) {
        add(fallbackThumb);
    }

    return gallery;
}

/* ===== MODAL SEQUENCE (NEXT/PREV POLISH) ===== */

function getDetailModalSequence(polish, list = []) {
    if (!polish) return list;

    const brand = (polish.brand || '').toLowerCase();
    const name = (polish.name || '').toLowerCase();

    const matches = list.filter(item =>
        (item.brand || '').toLowerCase() === brand &&
        (item.name || '').toLowerCase() === name
    );

    return matches.length ? matches : list;
}