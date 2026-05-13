const PROXY_URL =
  'https://ymrkqudtgklgkovfzotv.functions.supabase.co/football-proxy';

async function fetchFromProxy(
  type: 'next' | 'previous' | 'all' | 'live'
) {
  try {
    const SUPABASE_ANON_KEY =
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_ANON_KEY) {
      return [];
    }

    const url = `${PROXY_URL}?type=${type}`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    });

    const text = await res.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return [];
    }

    if (!res.ok) {
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

export const fetchLiveMatches = async () => {
  return fetchFromProxy('live');
};