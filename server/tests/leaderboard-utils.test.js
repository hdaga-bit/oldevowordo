import {
  resolveLeaderboardName,
  decorateLeaderboardRow,
} from "../leaderboard-utils.js";

describe("resolveLeaderboardName", () => {
  it("prefers displayName", () => {
    expect(
      resolveLeaderboardName({
        displayName: "Alex",
        username: "alex99",
        email: "a@b.com",
        id: "clx123",
      })
    ).toBe("Alex");
  });

  it("falls back to username then email local part", () => {
    expect(resolveLeaderboardName({ username: "wordler" })).toBe("wordler");
    expect(resolveLeaderboardName({ email: "player@example.com" })).toBe(
      "player"
    );
  });

  it("uses player id suffix when no real name is set", () => {
    expect(resolveLeaderboardName({ id: "clxabcdefghij" })).toBe(
      "Player efghij"
    );
  });

  it("ignores placeholder displayName values", () => {
    expect(
      resolveLeaderboardName({
        id: "user123abc",
        displayName: "Player",
        email: "cool@example.com",
      })
    ).toBe("cool");
  });
});

describe("decorateLeaderboardRow", () => {
  it("adds leaderboardName", () => {
    const row = decorateLeaderboardRow({ id: "abc123xyz", totalWins: 3 });
    expect(row.leaderboardName).toBe("Player 123xyz");
  });
});
