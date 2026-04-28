import { getResult, calculatePoints, isLocked } from "./predictionUtils";

describe("predictionUtils", () => {
  test("getResult returns HOME when home team wins", () => {
    expect(getResult(2, 1)).toBe("HOME");
  });

  test("getResult returns AWAY when away team wins", () => {
    expect(getResult(0, 3)).toBe("AWAY");
  });

  test("getResult returns DRAW when goals are equal", () => {
    expect(getResult(1, 1)).toBe("DRAW");
  });

  test("getResult returns null when match is not played", () => {
    expect(getResult(null, null)).toBe(null);
  });

  test("calculatePoints gives 3 points for correct prediction", () => {
    expect(calculatePoints("HOME", "HOME")).toBe(3);
  });

  test("calculatePoints gives 0 points for wrong prediction", () => {
    expect(calculatePoints("AWAY", "HOME")).toBe(0);
  });

  test("calculatePoints gives 0 points when result is missing", () => {
    expect(calculatePoints("DRAW", null)).toBe(0);
  });

  test("isLocked returns true less than one hour before match", () => {
    const matchDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    expect(isLocked(matchDate)).toBe(true);
  });

  test("isLocked returns false more than one hour before match", () => {
    const matchDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(isLocked(matchDate)).toBe(false);
  });
});

test("isLocked returns true when match has already started", () => {
  const matchDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  expect(isLocked(matchDate)).toBe(true);
});

test("isLocked returns true exactly one hour before match", () => {
  const matchDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  expect(isLocked(matchDate)).toBe(true);
});