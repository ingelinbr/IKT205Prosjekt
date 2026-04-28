const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY;

export const fetchMatches = async () => {
  try {
    console.log('API KEY:', API_KEY ? 'Finnes' : 'Mangler');

    const res = await fetch(
      'https://v3.football.api-sports.io/fixtures?league=39&season=2025&next=20',
      {
        method: 'GET',
        headers: {
          'x-apisports-key': API_KEY ?? '',
        },
      }
    );

    const data = await res.json();

    if (!data.response) {
      return [];
    }

    return data.response;
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
};

export const fetchPreviousMatches = async () => {
  try {
    const res = await fetch(
      'https://v3.football.api-sports.io/fixtures?league=39&season=2025&status=FT&last=20',
      {
        method: 'GET',
        headers: {
          'x-apisports-key': API_KEY ?? '',
        },
      }
    );

    const data = await res.json();

    if (!data.response) {
      return [];
    }

    return data.response;
  } catch (error) {
    console.error('Error fetching previous matches:', error);
    return [];
  }
};

export const fetchAllSeasonMatches = async () => {
  try {
    const res = await fetch(
      'https://v3.football.api-sports.io/fixtures?league=39&season=2025',
      {
        method: 'GET',
        headers: {
          'x-apisports-key': API_KEY ?? '',
        },
      }
    );

    const data = await res.json();

    if (!data.response) {
      return [];
    }

    return data.response;
  } catch (error) {
    console.error('Error fetching all season matches:', error);
    return [];
  }
};