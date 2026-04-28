import { render } from "@testing-library/react-native";
import MatchesScreen from "./MatchesScreen";

describe("MatchesScreen", () => {
  test("renders title", () => {
    const { getByText } = render(<MatchesScreen navigation={{}} />);
    expect(getByText("Kamper")).toBeTruthy();
  });
});