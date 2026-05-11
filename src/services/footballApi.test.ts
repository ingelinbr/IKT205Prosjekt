process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";

import {
  fetchMatches,
  fetchPreviousMatches,
  fetchAllSeasonMatches,
} from "./footballApi";

globalThis.fetch = jest.fn() as any;

describe("footballApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetchMatches returns upcoming matches from proxy", async () => {
    const mockMatches = [{ fixture: { id: 1 } }];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockMatches),
    });

    const result = await fetchMatches();

    expect(fetch).toHaveBeenCalledWith(
      "https://ymrkqudtgklgkovfzotv.functions.supabase.co/football-proxy?type=next",
      {
        headers: {
          apikey: "test-key",
        },
      }
    );

    expect(result).toEqual(mockMatches);
  });

  test("fetchPreviousMatches returns previous matches from proxy", async () => {
    const mockMatches = [{ fixture: { id: 2 } }];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockMatches),
    });

    const result = await fetchPreviousMatches();

    expect(fetch).toHaveBeenCalledWith(
      "https://ymrkqudtgklgkovfzotv.functions.supabase.co/football-proxy?type=previous",
      {
        headers: {
          apikey: "test-key",
        },
      }
    );

    expect(result).toEqual(mockMatches);
  });

  test("fetchAllSeasonMatches returns all season matches from proxy", async () => {
    const mockMatches = [{ fixture: { id: 3 } }];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockMatches),
    });

    const result = await fetchAllSeasonMatches();

    expect(fetch).toHaveBeenCalledWith(
      "https://ymrkqudtgklgkovfzotv.functions.supabase.co/football-proxy?type=all",
      {
        headers: {
          apikey: "test-key",
        },
      }
    );

    expect(result).toEqual(mockMatches);
  });

  test("fetchMatches returns empty array when response is not an array", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ error: "Something went wrong" }),
    });

    const result = await fetchMatches();

    expect(result).toEqual([]);
  });

  test("fetchMatches returns empty array when fetch fails", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchMatches();

    expect(result).toEqual([]);
  });
});