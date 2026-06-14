import { buildLetterStates } from "../utils.js";

export function createSelectors({ room, me, isHost }) {
  const battle = room?.battle;

  const maxGuesses = battle?.maxGuesses ?? 6;

  const canGuess =
    room?.mode === "battle" &&
    Boolean(battle?.started) &&
    !isHost &&
    Boolean(me) &&
    !me?.done &&
    (me?.guesses?.length ?? 0) < maxGuesses;

  const letterStates = buildLetterStates(me?.guesses);

  return {
    canGuess,
    letterStates,
    shouldShowVictory: false,
    maxGuesses,
  };
}
