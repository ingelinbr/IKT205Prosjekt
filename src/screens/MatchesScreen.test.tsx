import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import MatchesScreen from "./MatchesScreen";
import { fetchMatches } from "../services/footballApi";
import { supabase } from "../lib/supabase";

jest.mock("../services/footballApi", () => ({
  fetchMatches: jest.fn(),
}));

const mockUpsert = jest.fn(async () => ({ error: null }));

jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn(async () => ({
        data: [],
        error: null,
      })),
      upsert: mockUpsert,
    })),
  },
}));

const futureMatch = {
  fixture: {
    id: 123,
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: { short: "NS" },
  },
  league: {
    round: "Round 1",
  },
  teams: {
    home: { name: "Arsenal" },
    away: { name: "Chelsea" },
  },
  goals: {
    home: null,
    away: null,
  },
};

describe("MatchesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (fetchMatches as jest.Mock).mockResolvedValue([futureMatch]);

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
        },
      },
      error: null,
    });
  });

  test("saves prediction when user chooses home team", async () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const { findByText } = render(<MatchesScreen navigation={navigation} />);

    const homeButton = await findByText("Hjemme");

    fireEvent.press(homeButton);

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          user_id: "test-user-id",
          match_id: 123,
          prediction: "HOME",
          points: 0,
        },
        {
          onConflict: "user_id,match_id",
        }
      );
    });
  });

  test("shows saved prediction after choosing home team", async () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const { findByText } = render(<MatchesScreen navigation={navigation} />);

    const homeButton = await findByText("Hjemme");

    fireEvent.press(homeButton);

    expect(await findByText("Ditt valg: HOME | Poeng: 0")).toBeTruthy();
  });
});