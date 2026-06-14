import { useEffect, useRef } from "react";
import { useAudio } from "../../hooks/useAudio";

/**
 * Plays game SFX from /public/sounds:
 * correct — tile reveal (green / yellow only)
 * error — invalid guess
 * wrong — defeat / out of guesses
 * fourthGuess — bonus sting when the puzzle is solved on guess 4
 */
export function AudioFeedback({
  lastGuess,
  lastPattern,
  hasError = false,
  isVictory = false,
  winGuessCount = null,
  isDefeat = false,
  enabled = true,
}) {
  const { playSound, enabled: audioEnabled } = useAudio();
  const prevGuessRef = useRef(null);
  const prevPatternRef = useRef(null);

  const shouldPlay = enabled && audioEnabled;

  useEffect(() => {
    if (!shouldPlay || !lastPattern || !lastGuess) return;

    if (lastGuess === prevGuessRef.current && lastPattern === prevPatternRef.current) {
      return;
    }

    prevGuessRef.current = lastGuess;
    prevPatternRef.current = lastPattern;

    let tileIndex = 0;
    lastPattern.forEach((state) => {
      const isGreen = state === "correct" || state === "green";
      const isYellow = state === "present" || state === "yellow";
      if (!isGreen && !isYellow) return;

      const delay = tileIndex * 50;
      tileIndex += 1;
      setTimeout(() => {
        playSound("correct", { volume: isGreen ? 0.6 : 0.5 });
      }, delay);
    });
  }, [lastGuess, lastPattern, shouldPlay, playSound]);

  const prevErrorRef = useRef(0);
  useEffect(() => {
    if (!shouldPlay || !hasError) return;
    if (hasError === prevErrorRef.current) return;
    prevErrorRef.current = hasError;
    playSound("error", { volume: 0.6 });
  }, [hasError, shouldPlay, playSound]);

  const fourthGuessPlayedRef = useRef(false);
  useEffect(() => {
    if (!isVictory) {
      fourthGuessPlayedRef.current = false;
      return;
    }
    if (!shouldPlay || fourthGuessPlayedRef.current || winGuessCount !== 4) return;
    fourthGuessPlayedRef.current = true;
    const timer = window.setTimeout(() => {
      playSound("fourthGuess", { volume: 0.85 });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [isVictory, winGuessCount, shouldPlay, playSound]);

  const defeatPlayedRef = useRef(false);
  useEffect(() => {
    if (!isDefeat) {
      defeatPlayedRef.current = false;
      return;
    }
    if (!shouldPlay || defeatPlayedRef.current) return;
    defeatPlayedRef.current = true;
    playSound("wrong", { volume: 0.65 });
  }, [isDefeat, shouldPlay, playSound]);

  return null;
}

export default AudioFeedback;
