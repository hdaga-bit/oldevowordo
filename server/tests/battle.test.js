import {
  initBattleRoom,
  setHostWord,
  startBattleRound,
  handleBattleGuess,
  endBattleRound,
  resetBattleRound,
  canJoinBattle,
  setBattleSettings,
  kickBattlePlayer,
  sanitizeBattle,
  getBattleMaxGuesses,
} from "../modes/battle.js";
import { scoreGuess } from "../game.js";

// Mock scoreGuess for testing
const mockScoreGuess = (secret, guess) => {
  return scoreGuess(secret, guess);
};

// Mock updateStatsOnWin
const mockUpdateStatsOnWin = () => {};

describe("Battle Mode", () => {
  let room;

  beforeEach(() => {
    room = {
      id: "BATTLE123",
      mode: "battle",
      hostId: "host1",
      players: {
        host1: { guesses: [], done: false },
        player1: { guesses: [], done: false },
        player2: { guesses: [], done: false },
      },
      battle: null,
    };
    initBattleRoom(room);
  });

  describe("initBattleRoom", () => {
    it("initializes battle state with correct defaults", () => {
      expect(room.battle).toMatchObject({
        secret: null,
        started: false,
        winner: null,
        locked: false,
        maxGuesses: 6,
        roundMs: null,
        pendingStart: false,
      });
    });
  });

  describe("canJoinBattle", () => {
    it("allows join when lobby is open", () => {
      expect(canJoinBattle(room)).toEqual({ ok: true });
    });

    it("rejects when room is locked", () => {
      room.battle.locked = true;
      expect(canJoinBattle(room)).toEqual({ error: "Room is locked" });
    });

    it("rejects when battle started", () => {
      room.battle.started = true;
      expect(canJoinBattle(room)).toEqual({ error: "Battle already in progress" });
    });

    it("allows rejoin when locked", () => {
      room.battle.locked = true;
      expect(canJoinBattle(room, { isRejoin: true })).toEqual({ ok: true });
    });
  });

  describe("setBattleSettings", () => {
    it("updates lobby settings", () => {
      const result = setBattleSettings({
        room,
        locked: true,
        maxGuesses: 4,
        roundMs: 5 * 60 * 1000,
      });
      expect(result).toEqual({ ok: true });
      expect(room.battle.locked).toBe(true);
      expect(room.battle.maxGuesses).toBe(4);
      expect(room.battle.roundMs).toBe(5 * 60 * 1000);
    });

    it("rejects changes during round", () => {
      room.battle.started = true;
      expect(setBattleSettings({ room, locked: true })).toEqual({
        error: "Cannot change settings during a round",
      });
    });
  });

  describe("kickBattlePlayer", () => {
    it("removes a non-host player in lobby", () => {
      room.players.player1.socketId = "sock-p1";
      const result = kickBattlePlayer({ room, playerId: "player1" });
      expect(result).toEqual({ ok: true, socketId: "sock-p1" });
      expect(room.players.player1).toBeUndefined();
    });

    it("rejects kick during round", () => {
      room.battle.started = true;
      expect(kickBattlePlayer({ room, playerId: "player1" })).toEqual({
        error: "Cannot kick during a round",
      });
    });

    it("rejects kicking host", () => {
      expect(kickBattlePlayer({ room, playerId: "host1" })).toEqual({
        error: "Cannot kick this player",
      });
    });
  });

  describe("sanitizeBattle", () => {
    it("exposes host settings", () => {
      room.battle.locked = true;
      room.battle.maxGuesses = 3;
      room.battle.roundMs = 3 * 60 * 1000;
      expect(sanitizeBattle(room)).toMatchObject({
        locked: true,
        maxGuesses: 3,
        roundMs: 3 * 60 * 1000,
      });
    });
  });

  describe("setHostWord", () => {
    const mockValidateWord = (word) => word && word.length === 5 && /^[A-Z]{5}$/.test(word.toUpperCase());

    it("sets the host word and resets player guesses", () => {
      room.players.player1.guesses = [{ guess: "TEST", pattern: [] }];
      room.players.player2.guesses = [{ guess: "TEST", pattern: [] }];
      room.battle.lastRevealedWord = "CRANE";
      room.battle.winner = "player1";
      room.battle.deadline = Date.now() + 60000;
      room.battle.countdownEndsAt = Date.now() + 5000;
      room.roundClosed = true;

      const result = setHostWord({
        room,
        secret: "APPLE",
        validateWord: mockValidateWord,
      });

      expect(result).toEqual({ ok: true });
      expect(room.battle.secret).toBe("APPLE");
      expect(room.battle.lastRevealedWord).toBe(null);
      expect(room.battle.winner).toBe(null);
      expect(room.battle.deadline).toBe(null);
      expect(room.battle.countdownEndsAt).toBe(null);
      expect(room.roundClosed).toBe(false);
      expect(room.players.player1.guesses).toEqual([]);
      expect(room.players.player2.guesses).toEqual([]);
      expect(room.players.player1.done).toBe(false);
      expect(room.players.player2.done).toBe(false);
    });

    it("converts word to uppercase", () => {
      setHostWord({
        room,
        secret: "apple",
        validateWord: mockValidateWord,
      });

      expect(room.battle.secret).toBe("APPLE");
    });

    it("rejects invalid word", () => {
      const result = setHostWord({
        room,
        secret: "INVALID",
        validateWord: mockValidateWord,
      });

      expect(result).toEqual({ error: "Invalid word" });
      expect(room.battle.secret).toBe(null);
    });

    it("rejects changing the word during an active round", () => {
      room.battle.secret = "CRANE";
      room.battle.started = true;
      room.battle.deadline = Date.now() + 60000;

      const result = setHostWord({
        room,
        secret: "APPLE",
        validateWord: mockValidateWord,
      });

      expect(result).toEqual({ error: "Cannot set word during a round" });
      expect(room.battle.secret).toBe("CRANE");
      expect(room.battle.started).toBe(true);
      expect(room.battle.deadline).not.toBe(null);
    });
  });

  describe("startBattleRound", () => {
    it("starts round when secret is set and players exist", () => {
      room.battle.secret = "APPLE";
      const result = startBattleRound({ room });

      expect(result).toEqual({ ok: true });
      expect(room.battle.started).toBe(true);
      expect(room.battle.winner).toBe(null);
      expect(room.roundClosed).toBe(false);
    });

    it("rejects when secret is not set", () => {
      const result = startBattleRound({ room });

      expect(result).toEqual({ error: "Set a word first" });
      expect(room.battle.started).toBe(false);
    });

    it("rejects when only host exists", () => {
      room.players = { host1: { guesses: [], done: false } };
      room.battle.secret = "APPLE";
      const result = startBattleRound({ room });

      expect(result).toEqual({ error: "Need at least 2 players" });
    });
  });

  describe("handleBattleGuess", () => {
    beforeEach(() => {
      room.battle.secret = "APPLE";
      room.battle.started = true;
    });

    it("processes a correct guess and ends round", () => {
      const result = handleBattleGuess({
        room,
        socketId: "player1",
        guess: "APPLE",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });

      expect(result.ok).toBe(true);
      expect(result.ended).toBe(true);
      expect(room.battle.winner).toBe("player1");
      expect(room.battle.started).toBe(false);
      expect(room.battle.lastRevealedWord).toBe("APPLE");
    });

    it("processes an incorrect guess", () => {
      const result = handleBattleGuess({
        room,
        socketId: "player1",
        guess: "WORDS",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });

      expect(result.ok).toBe(true);
      expect(result.ended).toBe(false);
      expect(room.players.player1.guesses.length).toBe(1);
      expect(room.players.player1.done).toBe(false);
    });

    it("marks player as done after 6 guesses", () => {
      room.players.player1.guesses = [
        { guess: "CRANE", pattern: [] },
        { guess: "SLATE", pattern: [] },
        { guess: "HOUSE", pattern: [] },
        { guess: "MOUSE", pattern: [] },
        { guess: "WORDS", pattern: [] },
      ];

      const result = handleBattleGuess({
        room,
        socketId: "player1",
        guess: "PLANT",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });

      expect(room.players.player1.done).toBe(true);
      expect(room.players.player1.guesses.length).toBe(6);
    });

    it("respects custom maxGuesses", () => {
      room.battle.maxGuesses = 2;
      expect(getBattleMaxGuesses(room)).toBe(2);

      handleBattleGuess({
        room,
        socketId: "player1",
        guess: "WORDS",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });
      handleBattleGuess({
        room,
        socketId: "player1",
        guess: "CRANE",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });

      expect(room.players.player1.done).toBe(true);
      expect(room.players.player1.guesses.length).toBe(2);
    });

    it("ends round when all players are done with no winner", () => {
      const fiveGuesses = [
        { guess: "CRANE", pattern: [] },
        { guess: "SLATE", pattern: [] },
        { guess: "HOUSE", pattern: [] },
        { guess: "MOUSE", pattern: [] },
        { guess: "WORDS", pattern: [] },
      ];
      room.players.player1.guesses = [...fiveGuesses];
      room.players.player2.guesses = [...fiveGuesses];

      const result = handleBattleGuess({
        room,
        socketId: "player1",
        guess: "PLANT",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });

      // After player1's 6th guess, they're done, but round only ends if ALL players are done
      expect(room.players.player1.done).toBe(true);
      
      // Now player2 makes their 6th guess - this should end the round
      const result2 = handleBattleGuess({
        room,
        socketId: "player2",
        guess: "BREAD",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });

      expect(result2.ended).toBe(true);
      expect(room.battle.started).toBe(false);
      expect(room.battle.winner).toBe(null);
    });

    it("rejects guess from host", () => {
      const result = handleBattleGuess({
        room,
        socketId: "host1",
        guess: "APPLE",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });

      expect(result).toEqual({ error: "Host is spectating this round" });
    });

    it("rejects guess when battle not started", () => {
      room.battle.started = false;
      const result = handleBattleGuess({
        room,
        socketId: "player1",
        guess: "APPLE",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });

      expect(result).toEqual({ error: "Battle not started" });
    });

    it("rejects guess when player not in room", () => {
      const result = handleBattleGuess({
        room,
        socketId: "nonexistent",
        guess: "APPLE",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });

      expect(result).toEqual({ error: "Not in room" });
    });

    it("rejects guess when player already done", () => {
      room.players.player1.done = true;
      const result = handleBattleGuess({
        room,
        socketId: "player1",
        guess: "APPLE",
        scoreGuess: mockScoreGuess,
        updateStatsOnWin: mockUpdateStatsOnWin,
      });

      expect(result).toEqual({ error: "No guesses left" });
    });
  });

  describe("endBattleRound", () => {
    it("ends round with winner", () => {
      room.battle.started = true;
      room.battle.secret = "APPLE";
      room.players.player1.done = false;
      room.players.player2.done = false;

      endBattleRound(room, "player1", { updateStatsOnWin: mockUpdateStatsOnWin });

      expect(room.battle.started).toBe(false);
      expect(room.battle.winner).toBe("player1");
      expect(room.battle.lastRevealedWord).toBe("APPLE");
      expect(room.battle.deadline).toBe(null);
      expect(room.battle.countdownEndsAt).toBe(null);
      expect(room.players.player1.done).toBe(true);
      expect(room.players.player2.done).toBe(true);
      expect(room.roundClosed).toBe(true);
      // Note: mockUpdateStatsOnWin is called but we don't verify it in this test
    });

    it("ends round without winner", () => {
      room.battle.started = true;
      room.battle.secret = "APPLE";

      endBattleRound(room, null, { updateStatsOnWin: mockUpdateStatsOnWin });

      expect(room.battle.winner).toBe(null);
      expect(room.roundClosed).toBe(true);
      // Note: mockUpdateStatsOnWin should not be called when there's no winner
    });
  });

  describe("resetBattleRound", () => {
    it("resets all player state and battle state", () => {
      room.players.player1.guesses = [{ guess: "TEST", pattern: [] }];
      room.players.player1.done = true;
      room.players.player2.guesses = [{ guess: "TEST", pattern: [] }];
      room.players.player2.done = true;
      room.battle.started = true;
      room.battle.winner = "player1";
      room.battle.deadline = Date.now() + 60000;
      room.battle.countdownEndsAt = Date.now() + 5000;
      room.roundClosed = true;

      resetBattleRound(room);

      expect(room.players.player1.guesses).toEqual([]);
      expect(room.players.player1.done).toBe(false);
      expect(room.players.player2.guesses).toEqual([]);
      expect(room.players.player2.done).toBe(false);
      expect(room.battle.started).toBe(false);
      expect(room.battle.winner).toBe(null);
      expect(room.battle.deadline).toBe(null);
      expect(room.battle.countdownEndsAt).toBe(null);
      expect(room.roundClosed).toBe(false);
    });
  });
});

