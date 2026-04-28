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
    const mockMatches = [
      {
        fixture: { id: 1 },
        teams: {
          home: { name: "Arsenal" },
          away: { name: "Chelsea" },
        },
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockMatches,
    });

    const result = await fetchMatches();

    expect(fetch).toHaveBeenCalledWith(
      "https://ymrkqudtgklgkovfzotv.functions.supabase.co/football-proxy?type=next"
    );
    expect(result).toEqual(mockMatches);
  });

  test("fetchPreviousMatches returns previous matches from proxy", async () => {
    const mockMatches = [{ fixture: { id: 2 } }];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockMatches,
    });

    const result = await fetchPreviousMatches();

    expect(fetch).toHaveBeenCalledWith(
      "https://ymrkqudtgklgkovfzotv.functions.supabase.co/football-proxy?type=previous"
    );
    expect(result).toEqual(mockMatches);
  });

  test("fetchAllSeasonMatches returns all season matches from proxy", async () => {
    const mockMatches = [{ fixture: { id: 3 } }];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockMatches,
    });

    const result = await fetchAllSeasonMatches();

    expect(fetch).toHaveBeenCalledWith(
      "https://ymrkqudtgklgkovfzotv.functions.supabase.co/football-proxy?type=all"
    );
    expect(result).toEqual(mockMatches);
  });

  test("fetchMatches returns empty array when response is not an array", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ error: "Something went wrong" }),
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