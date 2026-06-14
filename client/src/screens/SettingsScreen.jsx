import { Link } from "react-router-dom";
import GradientBackground from "../components/ui/GradientBackground";
import { useSettings } from "../contexts/SettingsContext";
import { useAudio } from "../hooks/useAudio";

function Toggle({ id, label, description, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-4 cursor-pointer"
    >
      <div>
        <span className="block text-sm font-medium text-white">{label}</span>
        {description ? (
          <span className="block text-xs text-zinc-500 mt-1">{description}</span>
        ) : null}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 rounded border-zinc-600 bg-zinc-800 text-zinc-400 focus:ring-zinc-500"
      />
    </label>
  );
}

export default function SettingsScreen() {
  const { reducedMotion, setReducedMotion, colorblindTiles, setColorblindTiles } =
    useSettings();
  const { enabled, setEnabled, volume, setVolume } = useAudio();

  return (
    <GradientBackground>
      <div className="mx-auto max-w-lg px-4 py-10 md:py-14 pb-24">
        <Link
          to="/"
          className="text-sm text-zinc-400 hover:text-white transition mb-6 inline-block"
        >
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Preferences are saved on this device.
        </p>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1">
            Audio
          </h2>
          <Toggle
            id="audio-enabled"
            label="Sound effects"
            description="Keyboard, tiles, and game events"
            checked={enabled}
            onChange={setEnabled}
          />
          {enabled && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-4">
              <label htmlFor="volume" className="text-sm font-medium text-white">
                Volume
              </label>
              <input
                id="volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="mt-3 w-full accent-zinc-400"
              />
            </div>
          )}

          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1 pt-4">
            Display
          </h2>
          <Toggle
            id="reduced-motion"
            label="Reduce motion"
            description="Minimize animations and transitions"
            checked={reducedMotion}
            onChange={setReducedMotion}
          />
          <Toggle
            id="colorblind"
            label="Colorblind-friendly tiles"
            description="Blue / orange / gray tile colors"
            checked={colorblindTiles}
            onChange={setColorblindTiles}
          />

          {import.meta.env.DEV && (
            <>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1 pt-4">
                Developer
              </h2>
              <Link
                to="/dev/lab"
                className="block rounded-2xl border border-amber-800/40 bg-amber-950/20 px-4 py-4 text-sm font-medium text-amber-100 hover:bg-amber-950/40 transition"
              >
                Cosmetics lab (dev)
              </Link>
            </>
          )}
        </div>
      </div>
    </GradientBackground>
  );
}
