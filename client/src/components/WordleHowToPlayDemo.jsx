import React, { useEffect, useState } from "react";

const EXAMPLES = [
  {
    word: "HOUSE",
    highlightIndex: 0,
    state: "correct",
    label: (
      <>
        <strong className="text-white">H</strong> is in the word and in the correct spot.
      </>
    ),
  },
  {
    word: "STORY",
    highlightIndex: 2,
    state: "present",
    label: (
      <>
        <strong className="text-white">O</strong> is in the word but in the wrong spot.
      </>
    ),
  },
  {
    word: "BLAZE",
    highlightIndex: 2,
    state: "absent",
    label: (
      <>
        <strong className="text-white">Z</strong> is not in the word in any spot.
      </>
    ),
  },
];

const STATE_ANIM = {
  correct: "tileFlipToGreen",
  present: "tileFlipToYellow",
  absent: "tileFlipToGray",
};

function DemoTile({ letter, state, flipDelay, animate }) {
  const className =
    "grid place-items-center rounded-sm border font-bold text-lg select-none";
  const idleStyle = {
    width: 44,
    height: 44,
    backgroundColor: "var(--tile-empty-bg)",
    color: "var(--tile-text)",
    borderColor: "var(--tile-empty-border)",
  };

  if (!animate) {
    return (
      <div className={className} style={idleStyle}>
        {letter}
      </div>
    );
  }

  const colorAnim = STATE_ANIM[state];
  return (
    <div
      className={className}
      style={{
        ...idleStyle,
        animation: `tileFlipBase 0.5s ease-in-out ${flipDelay}ms both, ${colorAnim} 0.5s ease-in-out ${flipDelay}ms both`,
        transformStyle: "preserve-3d",
      }}
    >
      {letter}
    </div>
  );
}

function ExampleRow({ word, highlightIndex, state, label, rowDelay, animate }) {
  const letters = word.split("");
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 justify-center">
        {letters.map((ch, i) => (
          <DemoTile
            key={`${word}-${i}`}
            letter={ch}
            state={state}
            flipDelay={rowDelay + i * 100}
            animate={animate && i === highlightIndex}
          />
        ))}
      </div>
      <p className="text-sm text-white/75 text-center leading-snug">{label}</p>
    </div>
  );
}

/** Wordle-style tile color examples with flip animations. */
export default function WordleHowToPlayDemo({
  animate = true,
  compact = false,
  className = "",
}) {
  const [runFlip, setRunFlip] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!animate || reducedMotion) {
      setRunFlip(true);
      return;
    }
    setRunFlip(false);
    const t = window.setTimeout(() => setRunFlip(true), 120);
    return () => window.clearTimeout(t);
  }, [animate, reducedMotion]);

  const showColored = runFlip || reducedMotion;

  return (
    <div className={`space-y-4 ${className}`}>
      {!compact && (
        <div>
          <p className="text-sm text-white/80 text-center">
            Guess the word in 6 tries.
          </p>
          <ul className="text-sm text-white/70 space-y-1 list-disc list-inside mt-2">
            <li>Each guess must be a valid 5-letter word.</li>
            <li>Tile colors show how close your guess was.</li>
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3 text-center">
          Examples
        </p>
        <div className="space-y-5">
          {EXAMPLES.map((ex, rowIdx) => (
            <ExampleRow
              key={ex.word}
              word={ex.word}
              highlightIndex={ex.highlightIndex}
              state={ex.state}
              label={ex.label}
              rowDelay={rowIdx * 450}
              animate={showColored}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
