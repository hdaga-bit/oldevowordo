import React from "react";
import ParticleEffect from "../ParticleEffect";
import ConfettiEffect from "../ConfettiEffect";
import AudioFeedback from "./AudioFeedback";

/**
 * GameEffects - Unified wrapper for particle, confetti, and audio effects
 * 
 * Consolidates all game effects that were scattered across different game screens
 */
export function GameEffects({
  // Particle effects
  showParticles = false,
  showCorrectParticles = false,
  showStreakParticles = false,
  showVictoryParticles = false,
  particlePosition = { x: 0, y: 0 },
  particleIntensity = 1.0,
  streak = 0,
  
  // Confetti effects
  showConfetti = false,
  celebrationStyle = "confetti",
  
  // Audio effects
  lastGuess = null,
  lastPattern = null,
  hasError = false,
  isVictory = false,
  winGuessCount = null,
  isDefeat = false,
  
  // Feature flags (can be controlled by mode theme)
  enableParticles = true,
  enableConfetti = true,
  enableAudio = true,
  cosmeticTheme = null,
  winAnimation = null,
}) {
  const victoryParticleType =
    cosmeticTheme?.particles && cosmeticTheme.particles !== "victory"
      ? cosmeticTheme.particles
      : "victory";
  // The equipped win-animation slot wins over the theme default.
  const confettiStyle =
    (winAnimation && winAnimation.effect) ||
    (cosmeticTheme?.confetti && cosmeticTheme.confetti !== "none"
      ? cosmeticTheme.confetti
      : celebrationStyle);
  const confettiEnabled =
    enableConfetti && (winAnimation || cosmeticTheme?.confetti !== "none");
  return (
    <>
      {enableParticles && (
        <>
          <ParticleEffect
            trigger={showParticles}
            type="wordComplete"
            position={particlePosition}
            intensity={particleIntensity}
          />
          <ParticleEffect
            trigger={showCorrectParticles}
            type="correctGuess"
            position={particlePosition}
            intensity={1.2}
          />
          <ParticleEffect
            trigger={showStreakParticles}
            type="streak"
            position={particlePosition}
            intensity={
              streak >= 10 ? 2.5 : streak >= 5 ? 2.0 : 1.5
            }
          />
          <ParticleEffect
            trigger={showVictoryParticles}
            type={victoryParticleType}
            position={particlePosition}
            intensity={victoryParticleType === "minimal" ? 1.0 : 2.0}
          />
        </>
      )}
      {confettiEnabled && (
        <ConfettiEffect trigger={showConfetti} celebrationStyle={confettiStyle} />
      )}
      {enableAudio && (
        <AudioFeedback
          lastGuess={lastGuess}
          lastPattern={lastPattern}
          hasError={hasError}
          isVictory={isVictory}
          winGuessCount={winGuessCount}
          isDefeat={isDefeat}
          enabled={enableAudio}
        />
      )}
    </>
  );
}

export default GameEffects;
