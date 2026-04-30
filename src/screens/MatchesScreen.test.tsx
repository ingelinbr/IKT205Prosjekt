import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import MatchesScreen from "./MatchesScreen";

describe("MatchesScreen", () => {
  test("renders title", async () => {
    const { getByText } = render(<MatchesScreen navigation={{}} />);

    expect(getByText("Kamper")).toBeTruthy();
  });

  test("loads matches from real API", async () => {
    const { findByText } = render(<MatchesScreen navigation={{}} />);

    expect(await findByText("Kamper")).toBeTruthy();

    await waitFor(
      () => {
        expect(findByText("Kamper")).toBeTruthy();
      },
      { timeout: 10000 }
    );
  });
});