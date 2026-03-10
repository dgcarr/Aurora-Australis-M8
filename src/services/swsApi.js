const API_BASE = 'https://sws-data.sws.bom.gov.au/api/v1';

/**
 * Note: endpoint paths are based on SWS data examples; update these constants
 * if BoM changes path names.
 */
const ENDPOINTS = {
  kp: '/kp-index/latest',
  solarWind: '/solar-wind/latest',
  imf: '/imf/latest',
  notices: '/aurora/notices',
};

const STALE_AFTER_MS = 60 * 60 * 1000;

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function safeString(value, fallback = 'Unknown') {
  if (typeof value === 'string' && value.trim()) return value;
  return fallback;
}

async function getJson(path, query = '') {
  const url = `${API_BASE}${path}${query}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`SWS API request failed (${response.status}) for ${path}`);
  }

  return response.json();
}

function buildFreshnessInfo(fetchedAt, staleAfterMs = STALE_AFTER_MS) {
  return {
    fetchedAt,
    staleAfterMs,
  };
}

export async function fetchAuroraConditions() {
  const fetchedAt = Date.now();
  const [kpRaw, windRaw, imfRaw] = await Promise.all([
    getJson(ENDPOINTS.kp),
    getJson(ENDPOINTS.solarWind),
    getJson(ENDPOINTS.imf),
  ]);

  const kpIndex = Number(safeNumber(kpRaw?.data?.kp ?? kpRaw?.kp).toFixed(1));
  const solarWindSpeed = Math.round(safeNumber(windRaw?.data?.speed ?? windRaw?.speed));
  const bz = Number(safeNumber(imfRaw?.data?.bz ?? imfRaw?.bz).toFixed(1));

  return {
    kpIndex,
    solarWindSpeed,
    bz,
    freshness: buildFreshnessInfo(fetchedAt),
  };
}

export async function fetchAuroraNotices(region = 'au') {
  const fetchedAt = Date.now();
  const raw = await getJson(ENDPOINTS.notices, `?region=${region}`);
  const notices = raw?.data || raw?.notices || [];

  const normalizedNotices = notices.map((notice, idx) => ({
    id: safeString(notice.id, `${safeString(notice.title, 'Aurora advisory')}-${idx}`),
    severity: safeString(notice.severity || notice.type, 'outlook').toLowerCase(),
    title: safeString(notice.title, 'Aurora advisory'),
    message: safeString(notice.message || notice.summary, 'See source bulletin for details.'),
    issuedAt: safeString(notice.issued_at || notice.issuedAt),
  }));

  return {
    items: normalizedNotices,
    freshness: buildFreshnessInfo(fetchedAt),
  };
}
