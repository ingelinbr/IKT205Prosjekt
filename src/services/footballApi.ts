const PROXY_URL =
  "https://ymrkqudtgklgkovfzotv.functions.supabase.co/football-proxy";

export const fetchMatches = async () => {
  try {
    const res = await fetch(`${PROXY_URL}?type=next`);

    const data = await res.json();

    console.log(
      "NEXT matches:",
      Array.isArray(data) ? data.length : data
    );

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
};

export const fetchPreviousMatches = async () => {
  try {
    const res = await fetch(`${PROXY_URL}?type=previous`);

    const data = await res.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching previous matches:", error);
    return [];
  }
};

export const fetchAllSeasonMatches = async () => {
  try {
    const res = await fetch(`${PROXY_URL}?type=all`);

    const data = await res.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching all season matches:", error);
    return [];
  }
};