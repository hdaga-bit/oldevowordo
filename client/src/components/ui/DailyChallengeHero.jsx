import { motion } from "framer-motion";
import { Calendar, TrendingUp, Target, Trophy, BarChart3 } from "lucide-react";
import GlowButton from "./GlowButton";
import { BORDER_RADIUS, SHADOWS } from "../../design-system";

export default function DailyChallengeHero({ onPlay, stats = {}, loading = false }) {
  const {
    currentStreak = 0,
    maxStreak = 0,
    winRate = 0,
    totalWins = 0,
    totalPlayed = 0,
  } = stats;

  return (
    <motion.div
      className="relative overflow-hidden bg-zinc-900 border border-zinc-800 p-5 sm:p-6 md:p-8"
      style={{
        borderRadius: BORDER_RADIUS.xl,
        boxShadow: SHADOWS.md,
      }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div className="flex flex-col gap-6 md:grid md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <motion.div className="space-y-4 text-center md:text-left">
          <motion.div className="flex items-center justify-center md:justify-start gap-2 text-zinc-400">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Daily Challenge
            </span>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            Today&apos;s Word
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base md:text-lg max-w-xl mx-auto md:mx-0">
            Challenge yourself with today&apos;s puzzle. One word, six guesses.
            Keep the streak alive.
          </p>

          <motion.div className="flex flex-wrap justify-center md:justify-start gap-2">
            <MiniMetric
              label="Wins"
              value={totalWins}
              icon={<Trophy className="w-4 h-4" />}
            />
            <MiniMetric
              label="Played"
              value={totalPlayed}
              icon={<BarChart3 className="w-4 h-4" />}
            />
          </motion.div>

          <GlowButton
            onClick={onPlay}
            size="lg"
            className="mt-2 md:mt-4 mx-auto md:mx-0"
            loading={loading}
            loadingText="Loading..."
          >
            Play Today&apos;s Word
          </GlowButton>
        </motion.div>

        <motion.div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            value={currentStreak}
            label="Current Streak"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            value={maxStreak}
            label="Max Streak"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            value={`${winRate}%`}
            label="Win Rate"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <motion.div className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center">
      <motion.div className="flex justify-center text-zinc-400 mb-1.5">{icon}</motion.div>
      <motion.div className="text-lg sm:text-2xl font-bold text-white mb-0.5">
        {value}
      </motion.div>
      <motion.div className="text-[11px] sm:text-xs text-zinc-500 uppercase tracking-wide">
        {label}
      </motion.div>
    </motion.div>
  );
}

function MiniMetric({ label, value, icon }) {
  return (
    <motion.div className="inline-flex items-center gap-2 rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-zinc-300 text-xs font-medium">
      <span className="text-zinc-400">{icon}</span>
      <span>{label}:</span>
      <span className="text-white">{value}</span>
    </motion.div>
  );
}
