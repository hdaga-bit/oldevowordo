import {
  isSafeInput,
  sanitizePlayerName,
  sanitizeRoomId,
  sanitizeWord,
} from "../utils/sanitize.js";

describe("sanitizeRoomId", () => {
  it("converts to uppercase", () => {
    expect(sanitizeRoomId("abc123")).toBe("ABC123");
  });

  it("removes non-alphanumeric characters", () => {
    expect(sanitizeRoomId("ABC-123!@#")).toBe("ABC123");
    expect(sanitizeRoomId("room-123")).toBe("ROOM123");
  });

  it("limits to 8 characters", () => {
    expect(sanitizeRoomId("ABCDEFGHIJKLMNOP")).toBe("ABCDEFGH");
  });

  it("handles mixed case and special chars", () => {
    expect(sanitizeRoomId("Room-123!")).toBe("ROOM123");
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeRoomId(null)).toBe("");
    expect(sanitizeRoomId(undefined)).toBe("");
    expect(sanitizeRoomId(123)).toBe("");
  });
});

describe("sanitizePlayerName", () => {
  it("removes HTML tags", () => {
    expect(sanitizePlayerName("<script>alert('xss')</script>John")).toBe(
      "alert('xss')John",
    );
    expect(sanitizePlayerName("<b>Bold</b>Name")).toBe("BoldName");
  });

  it("removes control characters", () => {
    expect(sanitizePlayerName("John\x00Doe")).toBe("JohnDoe");
    expect(sanitizePlayerName("Test\x1FName")).toBe("TestName");
  });

  it("trims whitespace", () => {
    expect(sanitizePlayerName("  John Doe  ")).toBe("John Doe");
  });

  it("limits to 30 characters", () => {
    const long = "a".repeat(50);
    expect(sanitizePlayerName(long).length).toBe(30);
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizePlayerName(null)).toBe("");
    expect(sanitizePlayerName(undefined)).toBe("");
    expect(sanitizePlayerName(123)).toBe("");
  });
});

describe("sanitizeWord", () => {
  it("converts to uppercase", () => {
    expect(sanitizeWord("apple")).toBe("APPLE");
    expect(sanitizeWord("Apple")).toBe("APPLE");
  });

  it("removes non-letter characters", () => {
    expect(sanitizeWord("APP-LE")).toBe("APPLE");
    expect(sanitizeWord("APP123")).toBe("APP");
    expect(sanitizeWord("APP!@#LE")).toBe("APPLE");
  });

  it("limits to 5 characters", () => {
    expect(sanitizeWord("ABCDEFGHIJ")).toBe("ABCDE");
  });

  it("handles mixed input", () => {
    expect(sanitizeWord("aPp-L3!e")).toBe("APPLE");
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeWord(null)).toBe("");
    expect(sanitizeWord(undefined)).toBe("");
    expect(sanitizeWord(123)).toBe("");
  });
});

describe("isSafeInput", () => {
  it("returns true for safe strings", () => {
    expect(isSafeInput("Hello World")).toBe(true);
    expect(isSafeInput("123")).toBe(true);
    expect(isSafeInput("test@example.com")).toBe(true);
  });

  it("detects script tags", () => {
    expect(isSafeInput("<script>alert('xss')</script>")).toBe(false);
    expect(isSafeInput("<SCRIPT>alert('xss')</SCRIPT>")).toBe(false);
  });

  it("detects javascript: protocol", () => {
    expect(isSafeInput("javascript:alert('xss')")).toBe(false);
    expect(isSafeInput("JAVASCRIPT:alert('xss')")).toBe(false);
  });

  it("detects event handlers", () => {
    expect(isSafeInput("onclick=alert('xss')")).toBe(false);
    expect(isSafeInput("onerror=alert('xss')")).toBe(false);
    expect(isSafeInput("onload=alert('xss')")).toBe(false);
  });

  it("detects iframe tags", () => {
    expect(isSafeInput("<iframe src='evil.com'></iframe>")).toBe(false);
    expect(isSafeInput("<IFRAME></IFRAME>")).toBe(false);
  });

  it("detects object tags", () => {
    expect(isSafeInput("<object data='evil.swf'></object>")).toBe(false);
  });

  it("detects embed tags", () => {
    expect(isSafeInput("<embed src='evil.swf'>")).toBe(false);
  });

  it("returns false for non-string input", () => {
    expect(isSafeInput(null)).toBe(false);
    expect(isSafeInput(undefined)).toBe(false);
    expect(isSafeInput(123)).toBe(false);
    expect(isSafeInput({})).toBe(false);
  });
});
