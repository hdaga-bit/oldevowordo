import React, { useMemo, useRef } from "react";
import Keyboard from "../Keyboard";
import Board from "../Board";
import { UnifiedPlayerCard } from "../player/UnifiedPlayerCard";
import { GameEffects } from "../features/GameEffects";
import { GameTimer } from "../features/GameTimer";
import { GameStatusBar } from "../features/GameStatusBar";
import { getModeTheme, hasFeature } from "../../config/mode-themes";
import { useIsMobile } from "../../hooks/useIsMobile";
import { cn } from "../../lib/utils";
import { getBoardPreviewShellClasses } from "../../config/cosmetics.js";
import { getViewportTileLimits } from "../../utils/game-viewport-layout.js";
import GameShell from "./GameShell.jsx";
import GameBoardZone from "./GameBoardZone.jsx";

function modeToLayoutPreset(mode, isDualBoard) {
  if (mode === "daily") return "daily";
  if (mode === "shared") return "shared";
  if (mode === "battle" || mode === "battle_ai") return "battle";
  if (mode === "spectate") return "spectate";
  if (isDualBoard) return "duel-dual";
  return "duel-single";
}

/**
 * GameLayout — viewport gameplay shell (Wordle-like).
 * Header | flexible board zone (autoFit) | docked keyboard
 */
export function GameLayout({
  mode = "duel",

  headerTitle,
  headerSubtitle,
  headerExtra,
  timerDeadline,
  timerCountdownEndsAt,
  timerLabel,
  showTimer = false,

  statusMessage,
  statusBadges = [],

  players = [],
  playerLayout = "grid-cols-2",
  showPlayerSection = true,

  guesses = [],
  activeGuess = "",
  secretWord = null,
  secretWordState = "empty",
  isOwnBoard = true,
  boardProps = {},

  letterStates = {},
  onKeyPress,
  keyboardDisabled = false,
  showKeyboard = true,

  effects = {},
  cosmeticTheme = null,
  fontPack = null,
  winAnimation = null,

  isDualBoard = false,
  viewportLimits: viewportLimitsProp,
  keyboardMaxWidth: keyboardMaxWidthProp,
  boardZoneFillMode = "fit",

  className = "",
  headerClassName = "",
  playerSectionClassName = "",
  boardSectionClassName = "",
  footerClassName = "",

  children,

  renderHeader,
  renderPlayerSection,
  renderAboveBoard,
  renderBoard,
  renderFooter,
}) {
  const isMobile = useIsMobile();
  const theme = getModeTheme(mode);
  const keyboardVarsRef = useRef(null);

  const limits = useMemo(() => {
    if (viewportLimitsProp) return viewportLimitsProp;
    return getViewportTileLimits({
      layout: modeToLayoutPreset(mode, isDualBoard),
      isMobile,
      isDualBoard,
    });
  }, [viewportLimitsProp, mode, isMobile, isDualBoard]);

  const keyboardMaxWidth = keyboardMaxWidthProp ?? limits.keyboardMaxWidth;

  const enableParticles = hasFeature(mode, "particles");
  const enableConfetti = hasFeature(mode, "confetti");
  const themeScopeClasses = cn(cosmeticTheme?.boardClass, fontPack?.boardClass);
  const boardShellClasses =
    cosmeticTheme?.boardClass
      ? getBoardPreviewShellClasses({ theme: cosmeticTheme, font: fontPack })
      : "";

  const defaultHeader = (
    <div
      className={cn(
        "px-3",
        isMobile ? "pt-1 pb-0.5" : "pt-2 pb-1",
        headerClassName,
      )}
    >
      <div className="mx-auto max-w-7xl">
        {headerTitle && (
          <h2
            className={cn(
              "font-semibold text-white text-center",
              isMobile
                ? "text-[10px] uppercase tracking-[0.35em] leading-4"
                : "text-base md:text-lg",
            )}
          >
            {headerTitle}
          </h2>
        )}

        {headerSubtitle && (
          <div className="mt-0.5 text-center">
            <p className={cn("text-white/60", isMobile ? "text-[10px]" : "text-sm")}>
              {headerSubtitle}
            </p>
          </div>
        )}

        {headerExtra && (
          <div className="mt-1.5 flex flex-col items-center gap-1.5">{headerExtra}</div>
        )}

        {showTimer && (timerDeadline || timerCountdownEndsAt) && (
          <div className="mt-1.5">
            <GameTimer
              deadline={timerDeadline}
              countdownEndsAt={timerCountdownEndsAt}
              label={timerLabel}
              size={isMobile ? "sm" : "md"}
            />
          </div>
        )}

        {(statusMessage || statusBadges.length > 0) && (
          <div className="mt-1.5">
            <GameStatusBar
              mode={mode}
              status={statusMessage}
              badges={statusBadges}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>
    </div>
  );

  const playerBlock =
    showPlayerSection && (players.length > 0 || renderPlayerSection) ? (
      renderPlayerSection ? (
        renderPlayerSection()
      ) : (
        <section className={cn("w-full shrink-0 px-1", playerSectionClassName)}>
          {isMobile ? (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">
              {players.map((player, index) => (
                <UnifiedPlayerCard
                  key={player.id || index}
                  variant="compact"
                  size="sm"
                  isMobile={true}
                  onSelect={player.onSelect}
                  {...player}
                />
              ))}
            </div>
          ) : (
            <div className={cn("mx-auto grid max-w-4xl gap-2", playerLayout)}>
              {players.map((player, index) => (
                <UnifiedPlayerCard
                  key={player.id || index}
                  variant={player.variant || "detailed"}
                  size={player.size || "md"}
                  theme={theme}
                  {...player}
                />
              ))}
            </div>
          )}
        </section>
      )
    ) : null;

  const defaultBoard = (
    <div className={cn("h-full w-full max-w-full", boardShellClasses)}>
      <Board
        guesses={guesses}
        activeGuess={activeGuess}
        secretWord={secretWord}
        secretWordState={secretWordState}
        isOwnBoard={isOwnBoard}
        boardTheme={cosmeticTheme}
        className="h-full w-full"
        autoFit
        gap={limits.boardGap}
        padding={limits.boardPadding}
        minTile={limits.minTile}
        maxTile={limits.maxTile}
        {...boardProps}
      />
    </div>
  );

  const footerContent = (showKeyboard || renderFooter) && (
    <div
      ref={keyboardVarsRef}
      className={cn("mx-auto w-full px-2 md:px-3", themeScopeClasses)}
      style={{ maxWidth: keyboardMaxWidth || undefined }}
    >
      {renderFooter && <div className="mb-1.5">{renderFooter()}</div>}
      {showKeyboard && (
        <Keyboard
          onKeyPress={onKeyPress}
          letterStates={letterStates}
          disabled={keyboardDisabled}
          sticky={false}
          varsRootRef={keyboardVarsRef}
        />
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden",
        themeScopeClasses,
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <GameEffects
          {...effects}
          enableParticles={enableParticles}
          enableConfetti={enableConfetti}
          cosmeticTheme={cosmeticTheme}
          winAnimation={winAnimation}
        />
      </div>

      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col">
        <GameShell
          className="h-full min-h-0"
          header={
            renderHeader
              ? renderHeader()
              : headerTitle || headerSubtitle || headerExtra
              ? defaultHeader
              : null
          }
          footer={footerContent || null}
          footerClassName={cn("pt-1", isMobile ? "" : "pb-2", footerClassName)}
        >
          <div
            className={cn(
              "flex min-h-0 w-full flex-1 flex-col overflow-hidden",
              isMobile ? "px-2" : "px-3",
            )}
          >
            {playerBlock}
            {renderAboveBoard?.()}
            <GameBoardZone
              fillMode={boardZoneFillMode}
              className={boardSectionClassName}
              maxWidth={limits.stackMaxWidth}
            >
              {renderBoard ? renderBoard() : defaultBoard}
            </GameBoardZone>
            {children}
          </div>
        </GameShell>
      </div>
    </div>
  );
}

export default GameLayout;
