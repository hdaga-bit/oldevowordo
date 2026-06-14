import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Swords, Users, Shield, Trophy, Star, Clock, Zap, ArrowRight } from "lucide-react";
import GradientBackground from "../components/ui/GradientBackground";
import DailyChallengeHero from "../components/ui/DailyChallengeHero";
import AnimatedGameCard from "../components/ui/AnimatedGameCard";
import GlowButton from "../components/ui/GlowButton";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { buildApiUrl } from "../config";
import { logger } from "../utils/logger";
import HomeHowToPlaySection from "../components/HomeHowToPlaySection.jsx";
import OpenRoomCard from "../components/open-rooms/OpenRoomCard.jsx";
import ModeMark from "../components/modes/ModeMark.jsx";
import { MODE_LABELS } from "../config/mode-branding.js";
import duelCardBg from "../assets/images/duel-card-bg.png";
import battleCardBg from "../assets/images/battle-card-bg.png";
import aiBattleCardBg from "../assets/images/ai-battle-card-bg.png";
import sharedDuelCardBg from "../assets/images/shared-duel-card-bg.png";
import PendingJoinBanner from "../components/home/PendingJoinBanner.jsx";
import HomeOnboarding from "../components/home/HomeOnboarding.jsx";
import FeedbackModal from "../components/FeedbackModal.jsx";
import HomeFooterAd from "../components/ads/HomeFooterAd.jsx";
import DonateButton from "../components/DonateButton.jsx";
import { isDonateEnabled } from "../config/site";

const DEFAULT_DAILY_STATS = {
  currentStreak: 0,
  maxStreak: 0,
  winRate: 0,
  totalWins: 0,
  totalPlayed: 0,
};

const MODE_META = {
  duel: { label: "Duel", icon: Swords },
  battle: { label: "Battle Royale", icon: Users },
  battle_ai: { label: "AI Battle", icon: Zap },
  shared: { label: "Shared Duel", icon: Shield },
};

const DEFAULT_MODE_META = {
  label: "Multiplayer",
  icon: Users,
};

export default function HomeScreen({
  name,
  setName,
  roomId,
  setRoomId,
  mode,
  setMode,
  onCreate,
  onJoin,
  onPlayDaily,
  message,
  pendingJoin = null,
  onPendingJoin,
  onPendingJoinDismiss,
  joiningPending = false,
}) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isNameSet, setIsNameSet] = useState(!!name);
  const { user, isAuthenticated, refreshUser } = useAuth();
  const isAnonymous = !isAuthenticated || user?.isAnonymous;
  const [dailyStats, setDailyStats] = useState(DEFAULT_DAILY_STATS);
  const [openRooms, setOpenRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [eventStatus, setEventStatus] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [topPlayers, setTopPlayers] = useState([]);
  const [topStreaks, setTopStreaks] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || isAnonymous) return;

    const normalizedDisplay =
      typeof user?.displayName === "string" ? user.displayName.trim() : "";
    const savedName =
      typeof window !== "undefined"
        ? window.localStorage?.getItem("wp.lastName")?.trim()
        : "";
    const emailName =
      !normalizedDisplay &&
      !savedName &&
      typeof user?.email === "string" &&
      user.email.includes("@")
        ? user.email.split("@")[0] || ""
        : "";

    const derivedName = normalizedDisplay || savedName || emailName;

    if (!derivedName) return;

    if (derivedName !== name) {
      setName(derivedName);
    }
    if (!isNameSet) {
      setIsNameSet(true);
    }
  }, [isAuthenticated, isAnonymous, user, name, setName, isNameSet]);

  useEffect(() => {
    if (!isNameSet) {
      setDailyStats(DEFAULT_DAILY_STATS);
      return;
    }

    let isActive = true;

    async function loadDailyStats() {
      try {
        const response = await fetch(buildApiUrl("/api/daily/stats"), {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to load stats (${response.status})`);
        }

        const data = await response.json();
        if (!isActive) return;

        const normalized = {
          currentStreak: Number(data.currentStreak) || 0,
          maxStreak: Number(data.maxStreak) || 0,
          winRate: Number(data.winRate) || 0,
          totalWins: Number(data.totalWins) || 0,
          totalPlayed: Number(data.totalPlayed) || 0,
        };

        setDailyStats(normalized);

        const userStats = user?.stats;
        const needsRefresh =
          userStats &&
          (Number(userStats.totalWins ?? 0) !== normalized.totalWins ||
            Number(userStats.totalGames ?? 0) !== normalized.totalPlayed ||
            Number(userStats.currentStreak ?? userStats.streak ?? 0) !==
              normalized.currentStreak ||
            Number.parseFloat(userStats.winRate ?? 0) !== normalized.winRate);

        if (needsRefresh && typeof refreshUser === "function") {
          refreshUser();
        }
      } catch (error) {
        if (isActive) {
          setDailyStats(DEFAULT_DAILY_STATS);
          logger.error("Failed to load daily stats:", error);
        }
      }
    }

    loadDailyStats();

    return () => {
      isActive = false;
    };
  }, [isNameSet, isAuthenticated, isAnonymous, refreshUser]);

  useEffect(() => {
    if (!isNameSet) {
      setOpenRooms([]);
      setRoomsLoading(false);
      return;
    }

    let isActive = true;

    const fetchRooms = async (showLoader = false) => {
      if (!isActive) return;
      if (showLoader) setRoomsLoading(true);
      try {
        const response = await fetch(buildApiUrl("/api/rooms/open"), {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Failed to load open rooms (${response.status})`);
        }
        const data = await response.json();
        if (!isActive) return;
        setOpenRooms(Array.isArray(data?.rooms) ? data.rooms : []);
        setRoomsError("");
      } catch (error) {
        if (!isActive) return;
        logger.error("Failed to load open rooms:", error);
        setRoomsError("Unable to load open rooms right now.");
      } finally {
        if (isActive) setRoomsLoading(false);
      }
    };

    fetchRooms(true);
    const intervalId = setInterval(() => fetchRooms(false), 15000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [isNameSet]);

  useEffect(() => {
    let isActive = true;
    const fetchStatus = async () => {
      if (!isActive) return;
      try {
        const response = await fetch(buildApiUrl("/api/events/status"), {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Failed to load event status (${response.status})`);
        }
        const data = await response.json();
        if (!isActive) return;
        setEventStatus(data);
        setEventError("");
      } catch (error) {
        if (!isActive) return;
        logger.error("Failed to load event status:", error);
        setEventError("Unable to load event status.");
        setEventStatus(null);
      } finally {
        if (isActive) setEventLoading(false);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 15000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    async function fetchLeaderboard() {
      try {
        const [playersRes, streaksRes] = await Promise.all([
          fetch(buildApiUrl("/api/leaderboard/top-players"), {
            credentials: "include",
          }),
          fetch(buildApiUrl("/api/leaderboard/streaks"), {
            credentials: "include",
          }),
        ]);
        if (!isActive) return;
        if (playersRes.ok) {
          const data = await playersRes.json();
          if (isActive) setTopPlayers(Array.isArray(data) ? data : []);
        }
        if (streaksRes.ok) {
          const data = await streaksRes.json();
          if (isActive) setTopStreaks(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        logger.error("Failed to load leaderboard:", error);
      } finally {
        if (isActive) setLeaderboardLoading(false);
      }
    }
    fetchLeaderboard();
    return () => {
      isActive = false;
    };
  }, []);

  const eventRoom = useMemo(() => {
    if (!eventStatus?.roomId) return null;
    return openRooms.find((room) => room.id === eventStatus.roomId) || null;
  }, [eventStatus?.roomId, openRooms]);

  const eventSlotLabel = useMemo(() => {
    if (!eventStatus?.slot) return null;
    return `${eventStatus.slot} GMT`;
  }, [eventStatus?.slot]);

  const handleNameSubmit = () => {
    if (name.trim()) {
      setIsNameSet(true);
    }
  };

  const handlePlayMode = async (selectedMode) => {
    setMode(selectedMode);
    setCreating(true);
    try {
      if (selectedMode === "daily" && onPlayDaily) {
        await onPlayDaily();
      } else {
        await onCreate(selectedMode);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId || roomId.length !== 6) return;
    setJoining(true);
    try {
      await onJoin(roomId);
    } finally {
      setJoining(false);
    }
  };

  const handleQuickJoin = async (targetRoomId, targetMode) => {
    if (!targetRoomId || joining || joiningRoomId) return;
    const normalizedId = String(targetRoomId).toUpperCase();
    if (normalizedId.length !== 6) return;
    setJoiningRoomId(normalizedId);
    setRoomId(normalizedId);
    if (targetMode) {
      setMode(targetMode);
    }
    try {
      await onJoin(normalizedId, targetMode);
    } finally {
      setJoiningRoomId(null);
    }
  };

  const gameModes = [
    {
      mode: "battle",
      title: MODE_LABELS.battle,
      description: "Host sets word · race to solve",
      backgroundImage: battleCardBg,
      backgroundPosition: "center 35%",
    },
    {
      mode: "battle_ai",
      title: MODE_LABELS.battle_ai,
      description: "Timed rounds · AI host",
      backgroundImage: aiBattleCardBg,
      backgroundPosition: "center center",
    },
    {
      mode: "duel",
      title: MODE_LABELS.duel,
      description: "1v1 · secret word for your opponent",
      backgroundImage: duelCardBg,
      backgroundPosition: "center 40%",
    },
    {
      mode: "shared",
      title: MODE_LABELS.shared,
      description: "One board · take turns together",
      backgroundImage: sharedDuelCardBg,
      backgroundPosition: "center center",
    },
  ];

  if (!isNameSet) {
    return (
      <GradientBackground>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)] flex items-center justify-center">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-white mb-2 text-center">
                Welcome to EvoWordo
              </h2>
              <p className="text-white/70 text-center mb-6">
                Enter your name to get started
              </p>

              <label htmlFor="player-name-input" className="sr-only">
                Display name
              </label>
              <input
                id="player-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
                placeholder="Your display name"
                aria-label="Display name"
                className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-4 min-h-[56px] text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all mb-4"
                autoFocus
              />

              <GlowButton
                onClick={handleNameSubmit}
                size="lg"
                className="w-full"
                disabled={!name.trim()}
              >
                Continue
              </GlowButton>
              <p className="mt-4 text-center text-xs text-white/45 leading-relaxed">
                By continuing, you agree to our{" "}
                <Link to="/terms" className="underline hover:text-white/70">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline hover:text-white/70">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </motion.div>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <HomeOnboarding active={isNameSet} />
      <FeedbackModal open={showFeedback} onOpenChange={setShowFeedback} />
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 py-6 md:py-12 pb-24 md:pb-12">
        <div className="w-full space-y-8">
          {pendingJoin?.roomId ? (
            <PendingJoinBanner
              roomId={pendingJoin.roomId}
              mode={pendingJoin.mode}
              joining={joiningPending}
              onJoin={onPendingJoin}
              onDismiss={onPendingJoinDismiss}
            />
          ) : null}

          <DailyChallengeHero
            onPlay={() => handlePlayMode("daily")}
            stats={dailyStats}
            loading={creating}
          />

          <HomeHowToPlaySection />

          <section>
            <motion.h2
              className="text-2xl md:text-3xl font-bold text-white mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Game Modes
            </motion.h2>

            <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
              {gameModes.map((gameMode) => (
                <AnimatedGameCard
                  key={gameMode.mode}
                  modeMark={<ModeMark mode={gameMode.mode} size="pin" />}
                  title={gameMode.title}
                  backgroundImage={gameMode.backgroundImage}
                  backgroundPosition={gameMode.backgroundPosition}
                  ariaLabel={`Play ${gameMode.title}`}
                  onClick={() => handlePlayMode(gameMode.mode)}
                >
                  <p
                    className={`text-xs pt-2 ${
                      gameMode.backgroundImage ? "text-white/70" : "text-white/50"
                    }`}
                  >
                    {gameMode.description}
                  </p>
                </AnimatedGameCard>
              ))}
            </div>

            <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-4">
              <div
                className="flex gap-4"
                style={{
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {gameModes.map((gameMode, index) => (
                  <div
                    key={gameMode.mode}
                    className="flex-shrink-0 w-[280px]"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <AnimatedGameCard
                      modeMark={<ModeMark mode={gameMode.mode} size="pin" />}
                      title={gameMode.title}
                      backgroundImage={gameMode.backgroundImage}
                      backgroundPosition={gameMode.backgroundPosition}
                      ariaLabel={`Play ${gameMode.title}`}
                      onClick={() => handlePlayMode(gameMode.mode)}
                    >
                      <p
                        className={`text-xs pt-2 ${
                          gameMode.backgroundImage ? "text-white/70" : "text-white/50"
                        }`}
                      >
                        {gameMode.description}
                      </p>
                    </AnimatedGameCard>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <motion.h2
              className="text-2xl md:text-3xl font-bold text-white mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Open Game Rooms
            </motion.h2>

            <div className="space-y-4">
              {roomsError && !roomsLoading && (
                <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                  {roomsError}
                </div>
              )}

              {roomsLoading ? (
                <>
                  <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-full min-h-[180px] rounded-3xl border border-zinc-800 bg-zinc-900 animate-pulse"
                      />
                    ))}
                  </div>
                  <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-4">
                    <div
                      className="flex gap-4"
                      style={{
                        scrollSnapType: "x mandatory",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0 w-[280px] min-h-[180px] rounded-3xl border border-zinc-800 bg-zinc-900 animate-pulse"
                          style={{ scrollSnapAlign: "start" }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : openRooms.length === 0 ? (
                <motion.div
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 text-white/60 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-base">
                    No open rooms right now. Create one or check back soon!
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {openRooms.map((room, index) => (
                      <OpenRoomCard
                        key={room.id}
                        room={room}
                        meta={MODE_META[room.mode] || DEFAULT_MODE_META}
                        index={index}
                        onJoin={() => handleQuickJoin(room.id, room.mode)}
                        joining={joining}
                        joiningRoomId={joiningRoomId}
                      />
                    ))}
                  </div>
                  <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-4">
                    <div
                      className="flex gap-4"
                      style={{
                        scrollSnapType: "x mandatory",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      {openRooms.map((room, index) => (
                        <div
                          key={room.id}
                          className="flex-shrink-0 w-[280px]"
                          style={{ scrollSnapAlign: "start" }}
                        >
                          <OpenRoomCard
                            room={room}
                            meta={MODE_META[room.mode] || DEFAULT_MODE_META}
                            index={index}
                            onJoin={() => handleQuickJoin(room.id, room.mode)}
                            joining={joining}
                            joiningRoomId={joiningRoomId}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <motion.h2
              className="text-2xl md:text-3xl font-bold text-white mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              Active Events
            </motion.h2>

            <div className="space-y-4">
              {eventError && !eventLoading && (
                <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                  {eventError}
                </div>
              )}

              {eventLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="h-full min-h-[200px] rounded-3xl border border-zinc-800 bg-zinc-900 animate-pulse" />
                </div>
              ) : eventStatus?.active && eventStatus?.roomId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <motion.div
                    className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col hover:border-zinc-600 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-zinc-800 text-zinc-300">
                        <Zap className="w-4 h-4" />
                        Live Now
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">
                        {eventSlotLabel || "Today"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-white/50">
                        AI Battle
                      </p>
                      <h3 className="text-xl font-bold text-white mt-1">
                        AI Battle Hour
                      </h3>
                      <p className="text-sm text-white/60 mt-2">
                        Jump into our featured AI-hosted lobby. Rounds
                        auto-cycle every few seconds—perfect for quick matches.
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-sm text-white/70">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                          <Users className="w-4 h-4 text-white/60" />
                          <span>
                            {eventRoom?.playerCount ?? 0}
                            {eventRoom?.capacity
                              ? ` / ${eventRoom.capacity}`
                              : " players"}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                          <Clock className="w-4 h-4 text-white/60" />
                          <span>Ends {eventSlotLabel || "soon"}</span>
                        </div>
                      </div>
                      <GlowButton
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          handleQuickJoin(eventStatus.roomId, "battle_ai")
                        }
                        disabled={
                          !eventStatus.roomId ||
                          Boolean(joiningRoomId) ||
                          joining
                        }
                        loading={joiningRoomId === eventStatus.roomId}
                        loadingText="Joining..."
                      >
                        Join Now
                      </GlowButton>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 text-white/60 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-base">
                    No live events right now. Check back during the next AI
                    Battle Hour{eventSlotLabel ? ` (${eventSlotLabel})` : ""}.
                  </p>
                </motion.div>
              )}
            </div>
          </section>

          <section>
            <motion.div
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                Join a Room
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <label htmlFor="room-code-input" className="sr-only">
                  Room code
                </label>
                <input
                  id="room-code-input"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  aria-label="Room code (6 letters)"
                  maxLength={6}
                  className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 min-h-[56px] text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all uppercase text-center text-lg tracking-wider font-mono"
                />
                <GlowButton
                  onClick={handleJoinRoom}
                  size="lg"
                  disabled={!roomId || roomId.length !== 6 || joining}
                  loading={joining}
                  loadingText="Joining..."
                  className="sm:w-auto"
                >
                  Join Room
                </GlowButton>
              </div>
              {message && (
                <motion.p
                  className="mt-4 text-sm text-red-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {message}
                </motion.p>
              )}
            </motion.div>
          </section>

          <section>
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Leaderboard
              </h2>
              <button
                onClick={() => navigate("/leaderboard")}
                className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-zinc-100 transition-colors font-medium"
              >
                View Full Board
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <LeaderboardCard
                title="Top Players"
                icon={<Trophy className="w-6 h-6 text-yellow-400" />}
              >
                <LeaderboardList
                  loading={leaderboardLoading}
                  items={topPlayers.slice(0, 3)}
                  renderItem={(p, i) => (
                    <LeaderboardRow
                      key={i}
                      rank={i + 1}
                      name={p.leaderboardName || p.displayName || p.username || "Player"}
                      stat={`${p.totalWins}W / ${p.totalGames}G`}
                    />
                  )}
                  emptyText="No players yet — be the first!"
                />
              </LeaderboardCard>

              <LeaderboardCard
                title="Top Streaks"
                icon={<Star className="w-6 h-6 text-zinc-400" />}
              >
                <LeaderboardList
                  loading={leaderboardLoading}
                  items={topStreaks.slice(0, 3)}
                  renderItem={(p, i) => (
                    <LeaderboardRow
                      key={i}
                      rank={i + 1}
                      name={p.leaderboardName || p.displayName || p.username || "Player"}
                      stat={`${p.longestStreak} best · ${p.streak} current`}
                    />
                  )}
                  emptyText="No streaks yet — start one today!"
                />
              </LeaderboardCard>
            </div>
          </section>

          <HomeFooterAd />

          <footer className="text-center py-8 text-white/50 text-sm space-y-2">
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <Link to="/privacy" className="hover:text-white/80 transition">
                Privacy
              </Link>
              <span aria-hidden className="text-white/25">
                ·
              </span>
              <Link to="/terms" className="hover:text-white/80 transition">
                Terms
              </Link>
              <span aria-hidden className="text-white/25">
                ·
              </span>
              <button
                type="button"
                onClick={() => setShowFeedback(true)}
                className="hover:text-white/80 transition"
              >
                Feedback
              </button>
              {isDonateEnabled() ? (
                <>
                  <span aria-hidden className="text-white/25">
                    ·
                  </span>
                  <DonateButton variant="link" className="hover:text-white/80" />
                </>
              ) : null}
              <span aria-hidden className="text-white/25">
                ·
              </span>
              <Link to="/settings" className="hover:text-white/80 transition">
                Settings
              </Link>
            </nav>
            <p>© 2026 EvoWordo. Daily word, multiplayer races.</p>
          </footer>
        </div>
      </div>
    </GradientBackground>
  );
}

function LeaderboardCard({ title, icon, children }) {
  return (
    <motion.div
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      whileHover={{ borderColor: "rgba(255, 255, 255, 0.3)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function LeaderboardList({ loading, items, renderItem, emptyText }) {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white/80" />
      </div>
    );
  }
  if (!items || items.length === 0) {
    return (
      <div className="text-white/50 text-sm text-center py-4">{emptyText}</div>
    );
  }
  return <div className="space-y-2">{items.map(renderItem)}</div>;
}

function LeaderboardRow({ rank, name, stat }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
      <span className="w-7 text-center text-sm font-bold text-white/70">
        {medals[rank - 1] || rank}
      </span>
      <span className="flex-1 text-sm text-white truncate">{name}</span>
      <span className="text-xs text-white/60 font-mono whitespace-nowrap">
        {stat}
      </span>
    </div>
  );
}
