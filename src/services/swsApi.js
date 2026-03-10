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

async function getJson(path, query = '') {
  const url = `${API_BASE}${path}${query}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`SWS API request failed (${response.status}) for ${path}`);
  }

  return response.json();
}

export async function fetchAuroraConditions() {
  const [kpRaw, windRaw, imfRaw] = await Promise.all([
    getJson(ENDPOINTS.kp),
    getJson(ENDPOINTS.solarWind),
    getJson(ENDPOINTS.imf),
  ]);

  return {
    kpIndex: Number(Number(kpRaw?.data?.kp ?? kpRaw?.kp ?? 0).toFixed(1)),
    solarWindSpeed: Math.round(Number(windRaw?.data?.speed ?? windRaw?.speed ?? 0)),
    bz: Number(Number(imfRaw?.data?.bz ?? imfRaw?.bz ?? 0).toFixed(1)),
  };
}

export async function fetchAuroraNotices(region = 'au') {
  const raw = await getJson(ENDPOINTS.notices, `?region=${region}`);
  const notices = raw?.data || raw?.notices || [];

  return notices.map((notice, idx) => ({
    id: notice.id || `${notice.title}-${idx}`,
    severity: String(notice.severity || notice.type || 'outlook').toLowerCase(),
    title: notice.title || 'Aurora advisory',
    message: notice.message || notice.summary || 'See source bulletin for details.',
    issuedAt: notice.issued_at || notice.issuedAt || 'Unknown',
  }));
}
