import { useCallback, useRef, useEffect, useState } from "react";
import { useGameContext } from "../contexts/GameContext";

export function useBattleGame(room, canGuessBattle, isHost, wasHost, battleActions, aiBattleActions) {
  const {
    screen,
    roomId,
    currentGuess,
    setCurrentGuess,
    setShowActiveError,
    setShakeKey,
    setMsg,
  } = useGameContext();

  const gameErrorTimeoutRef = useRef(null);
  const [submittingGuess, setSubmittingGuess] = useState(false);
  const submittingRef = useRef(false);
  const currentGuessRef = useRef(currentGuess);
  const canGuessRef = useRef(canGuessBattle);
  const modeRef = useRef(room?.mode);
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    currentGuessRef.current = currentGuess;
  }, [currentGuess]);
  useEffect(() => {
    canGuessRef.current = canGuessBattle;
  }, [canGuessBattle]);
  useEffect(() => {
    modeRef.current = room?.mode;
  }, [room?.mode]);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (gameErrorTimeoutRef.current) {
        clearTimeout(gameErrorTimeoutRef.current);
        gameErrorTimeoutRef.current = null;
      }
    };
  }, []);

  const bumpActiveRowError = useCallback(() => {
    setShowActiveError(true);
    setShakeKey((k) => k + 1);
    if (gameErrorTimeoutRef.current) {
      clearTimeout(gameErrorTimeoutRef.current);
    }
    gameErrorTimeoutRef.current = setTimeout(() => setShowActiveError(false), 300);
  }, [setShowActiveError, setShakeKey]);

  const handleBattleKey = useCallback(
    async (key) => {
      if (!canGuessRef.current) return;
      if (key === "ENTER") {
        const guess = currentGuessRef.current;
        if (guess.length !== 5) {
          bumpActiveRowError();
          return;
        }
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmittingGuess(true);
        try {
          const actions =
            modeRef.current === "battle_ai" ? aiBattleActions : battleActions;
          const result = await actions?.submitGuess?.(
            roomIdRef.current,
            guess,
            canGuessRef.current,
          );
          if (result?.error) {
            bumpActiveRowError();
            const text =
              result.error === "Invalid word" ? "Not in word list" : result.error;
            setMsg(text);
            setCurrentGuess("");
            return;
          }
          setCurrentGuess("");
          setShowActiveError(false);
        } finally {
          submittingRef.current = false;
          setSubmittingGuess(false);
        }
      } else if (key === "BACKSPACE") {
        setCurrentGuess((p) => p.slice(0, -1));
      } else if (/^[A-Z]$/.test(key)) {
        setCurrentGuess((p) => (p.length < 5 ? p + key : p));
      }
    },
    [
      battleActions,
      aiBattleActions,
      bumpActiveRowError,
      setCurrentGuess,
      setShowActiveError,
      setShakeKey,
      setMsg,
    ],
  );

  // Keyboard event handler for game screen — stable listener registration.
  useEffect(() => {
    if (screen !== "game") return;
    if (room?.mode !== "battle" && room?.mode !== "battle_ai") return;

    const onKeyDown = (e) => {
      // If I'm the host in Battle and the round hasn't started yet,
      // the host is typing the secret in the dashboard — let that input handle it.
      const hostTyping =
        (room?.mode === "battle" && isHost && !room?.battle?.started) ||
        (room?.mode === "battle_ai" &&
          (isHost || wasHost) &&
          !room?.battle?.started);
      if (hostTyping) return;

      const key =
        e.key === "Enter"
          ? "ENTER"
          : e.key === "Backspace"
            ? "BACKSPACE"
            : /^[a-zA-Z]$/.test(e.key)
              ? e.key.toUpperCase()
              : null;
      if (!key) return;
      handleBattleKey(key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    screen,
    room?.mode,
    room?.battle?.started,
    isHost,
    wasHost,
    handleBattleKey,
  ]);

  return {
    handleBattleKey,
    submittingGuess,
  };
}
