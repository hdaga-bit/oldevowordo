import { validateWord } from "../../api";
import { emitAsync } from "../utils.js";
import { logger } from "../../utils/logger";

export function createActions(socket) {
  const setHostWord = async (roomId, word) => {
    if (!word || typeof word !== "string" || word.length !== 5) {
      return { error: "Invalid word format" };
    }

    const validation = await validateWord(word);
    if (!validation.valid) return { error: "Host word must be valid" };

    return emitAsync(socket, "setHostWord", {
      roomId,
      secret: word,
    });
  };

  const startBattle = (roomId) => emitAsync(socket, "startBattle", { roomId });

  const setWordAndStart = async (roomId, word) => {
    const setResult = await setHostWord(roomId, word);
    if (setResult?.error) return setResult;

    const startResult = await startBattle(roomId);
    if (startResult?.error) return startResult;

    return { success: true };
  };

  const setBattleSettings = (roomId, settings) =>
    emitAsync(socket, "setBattleSettings", { roomId, ...settings });

  const kickPlayer = (roomId, playerId) =>
    emitAsync(socket, "battleKickPlayer", { roomId, playerId });

  const claimHost = (roomId) =>
    emitAsync(socket, "claimBattleHost", { roomId });

  const submitGuess = async (roomId, currentGuess, canGuess) => {
    if (!canGuess) return { error: "Cannot guess right now" };
    if (currentGuess.length !== 5) return { error: "Guess must be 5 letters" };

    const response = await emitAsync(socket, "makeGuess", {
      roomId,
      guess: currentGuess,
    });

    if (response?.error) {
      logger.warn("[battle makeGuess] error", response.error);
      return { error: response.error };
    }

    return response;
  };

  const playAgain = (roomId) => emitAsync(socket, "playAgain", { roomId });

  return {
    setHostWord,
    startBattle,
    setWordAndStart,
    setBattleSettings,
    kickPlayer,
    claimHost,
    submitGuess,
    playAgain,
  };
}
