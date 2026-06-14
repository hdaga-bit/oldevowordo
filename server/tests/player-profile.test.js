import {
  isPlaceholderDisplayName,
  normalizePlayerNameInput,
} from "../player-profile.js";

describe("isPlaceholderDisplayName", () => {
  it("treats generic labels as placeholders", () => {
    expect(isPlaceholderDisplayName("Player")).toBe(true);
    expect(isPlaceholderDisplayName("Guest Player")).toBe(true);
    expect(isPlaceholderDisplayName("Player abc123")).toBe(true);
  });

  it("accepts real names", () => {
    expect(isPlaceholderDisplayName("Morgan")).toBe(false);
    expect(isPlaceholderDisplayName("PlayerOne")).toBe(false);
  });
});

describe("normalizePlayerNameInput", () => {
  it("sanitizes valid names", () => {
    expect(normalizePlayerNameInput("  Alex  ")).toBe("Alex");
  });

  it("rejects empty input", () => {
    expect(normalizePlayerNameInput("   ")).toBe(null);
  });
});
