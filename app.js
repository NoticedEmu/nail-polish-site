/* =========================================================
   Shared Javascript
   ========================================================= */

async function fetchPolishData() {
    const response = await fetch('data.json');

    if (!response.ok) {
        throw new Error(`Failed to load data.json: ${response.status}`);
    }

    return await response.json();
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

    function add(entry) {
        if (!entry) return;

        let src = '';
        let thumb = '';
        let alt = '';

        if (typeof entry === 'string') {
            src = entry.trim();
            thumb = src;
        } else if (typeof entry === 'object') {
            src = String(entry.src ?? entry.image ?? entry.url ?? '').trim();
            thumb = String(entry.thumb ?? src).trim();
            alt = String(entry.alt ?? '').trim();
        }

        if (!src || seen.has(src)) return;
        seen.add(src);

        gallery.push({
            src,
            thumb: thumb || src,
            alt
        });
    }

    [
        ...(Array.isArray(polish?.gallery) ? polish.gallery : []),
        polish?.image,
        polish?.thumb
    ].forEach(add);

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