/* =========================================================
   Shared Javascript
   ========================================================= */

async function fetchPolishData() {
    const cacheBust = `v=${Date.now()}`;
    const response = await fetch(`data.json?${cacheBust}`, {
        cache: 'no-store'
    });

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

    const cleaned = raw
        .replaceAll('\\', '/')
        .replaceAll('&amp;', '&')
        .replace(/^\.\//, '')
        .replace(/^images\//, 'Images/')
        .trim();

    return cleaned
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/')
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
            entry.image,
            thumb
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
        name,
        filename,
        thumb,
        image: imageOne,
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
        )
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
    const normalizedPolish = normalizePolishEntry(polish);

    function add(entry) {
        if (!entry) return;

        let src = '';
        let thumb = '';
        let alt = '';

        if (typeof entry === 'string') {
            src = normalizeAssetPath(entry);
            thumb = src;
        } else if (typeof entry === 'object') {
            src = normalizeAssetPath(
                entry.src ??
                entry.image ??
                entry.url ??
                entry['image one'] ??
                entry.imageOne ??
                ''
            );

            thumb = normalizeAssetPath(entry.thumb ?? entry.Thumb ?? src);
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
        ...(Array.isArray(normalizedPolish?.gallery) ? normalizedPolish.gallery : []),
        normalizedPolish?.imageOne,
        normalizedPolish?.imageTwo,
        normalizedPolish?.imageThree,
        normalizedPolish?.image,
        normalizedPolish?.thumb
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