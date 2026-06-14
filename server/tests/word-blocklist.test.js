import { describe, it, expect } from "@jest/globals";
import {
  BUILTIN_BLOCKED,
  filterBlockedWords,
  loadBlocklist,
} from "../word-blocklist.js";

describe("word blocklist", () => {
  it("blocks known offensive 5-letter words", () => {
    const blocklist = loadBlocklist();
    expect(blocklist.has("FUCKS")).toBe(true);
    expect(blocklist.has("RAPED")).toBe(true);
  });

  it("filterBlockedWords splits kept and removed", () => {
    const blocklist = new Set(["FUCKS", "HOUSE"]);
    const { kept, removed } = filterBlockedWords(
      ["CRANE", "FUCKS", "HOUSE", "SLATE"],
      blocklist,
    );
    expect(kept).toEqual(["CRANE", "SLATE"]);
    expect(removed).toEqual(["FUCKS", "HOUSE"]);
  });

  it("builtin list entries are 5 letters", () => {
    for (const w of BUILTIN_BLOCKED) {
      expect(w).toMatch(/^[A-Z]{5}$/);
    }
  });
});
