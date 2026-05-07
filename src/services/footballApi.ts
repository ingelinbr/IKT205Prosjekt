const PROXY_URL =
  'https://ymrkqudtgklgkovfzotv.functions.supabase.co/football-proxy';

const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function fetchFromProxy(type: 'next' | 'previous' | 'all') {
  try {
    if (!SUPABASE_ANON_KEY) {
      console.log('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');
      return [];
    }

    const url = `${PROXY_URL}?type=${type}`;
    console.log('Fetching football data from:', url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    console.log(`Football proxy status (${type}):`, res.status);

    const text = await res.text();
    console.log(`Football proxy raw text (${type}):`, text.slice(0, 500));

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.log(`Football proxy returned non-JSON (${type})`);
      return [];
    }

    console.log(
      `Football proxy response (${type}):`,
      Array.isArray(data) ? `${data.length} matches` : data
    );

    if (!res.ok) {
      console.log(`Football proxy error (${type}):`, data);
      return [];
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${type} matches:`, error);
    return [];
  }
}

export const fetchMatches = async () => {
  return fetchFromProxy('next');
};

export const fetchPreviousMatches = async () => {
  return fetchFromProxy('previous');
};

export const fetchAllSeasonMatches = async () => {
  return fetchFromProxy('all');
};