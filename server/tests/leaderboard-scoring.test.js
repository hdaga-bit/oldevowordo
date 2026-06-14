import {
  scoreRow,
  scoreGame,
  resolveEfficiencyScore,
} from "../leaderboard-scoring.js";

describe("scoreRow", () => {
  it("weights green higher than yellow", () => {
    const greens = scoreRow(["green", "green", "green", "gray", "gray"]);
    const yellows = scoreRow(["yellow", "yellow", "yellow", "gray", "gray"]);
    expect(greens).toBe(9);
    expect(yellows).toBe(3);
    expect(greens).toBeGreaterThan(yellows);
  });

  it("accepts correct/present aliases", () => {
    expect(scoreRow(["correct", "present", "absent", "gray", "grey"])).toBe(4);
  });
});

describe("scoreGame", () => {
  it("returns 0 for losses", () => {
    expect(scoreGame([["yellow"]], false)).toBe(0);
  });

  it("rewards fewer attempts", () => {
    const in3 = scoreGame(
      [
        ["yellow", "gray", "gray", "gray", "gray"],
        ["green", "green", "green", "gray", "gray"],
        ["green", "green", "green", "green", "green"],
      ],
      true
    );
    const in5 = scoreGame(
      [
        ["gray", "gray", "gray", "gray", "gray"],
        ["gray", "gray", "gray", "gray", "gray"],
        ["gray", "gray", "gray", "gray", "gray"],
        ["gray", "gray", "gray", "gray", "gray"],
        ["green", "green", "green", "green", "green"],
      ],
      true
    );
    expect(in3).toBeGreaterThan(in5);
  });

  it("ranks better tile quality higher at same attempt count", () => {
    const strong = scoreGame(
      [
        ["green", "green", "yellow", "gray", "gray"],
        ["green", "green", "green", "green", "green"],
      ],
      true
    );
    const weak = scoreGame(
      [
        ["yellow", "yellow", "yellow", "gray", "gray"],
        ["green", "green", "green", "green", "green"],
      ],
      true
    );
    expect(strong).toBeGreaterThan(weak);
  });
});

describe("resolveEfficiencyScore", () => {
  it("uses stored score when present", () => {
    expect(resolveEfficiencyScore([], true, 99)).toBe(99);
  });

  it("computes from patterns when stored is missing", () => {
    const patterns = [["green", "green", "green", "green", "green"]];
    expect(resolveEfficiencyScore(patterns, true, null)).toBe(scoreGame(patterns, true));
  });
});
