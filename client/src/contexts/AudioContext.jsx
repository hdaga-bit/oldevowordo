import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getSoundUrl, SOUND_FILES } from "../utils/sounds";

const AudioContext = createContext(null);

const DEFAULT_SOUND_PACK = {
  id: "standard",
  volumeMultiplier: 1.0,
  pitchShift: 0,
};

export function AudioProvider({ children }) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("wordleplus_audio_enabled");
    return stored !== null ? stored === "true" : true;
  });

  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 0.7;
    const stored = localStorage.getItem("wordleplus_audio_volume");
    return stored ? parseFloat(stored) : 0.7;
  });

  const [soundPack, setSoundPack] = useState(DEFAULT_SOUND_PACK);
  const soundPackRef = useRef(soundPack);
  useEffect(() => {
    soundPackRef.current = soundPack;
  }, [soundPack]);

  const audioCache = useRef(new Map());

  const loadAudio = useCallback(
    (soundName) => {
      if (!enabled) return null;
      if (audioCache.current.has(soundName)) {
        return audioCache.current.get(soundName);
      }
      try {
        const url = getSoundUrl(soundName);
        if (!url) return null;
        const audio = new Audio(url);
        audio.volume = volume;
        audio.preload = "auto";
        audioCache.current.set(soundName, audio);
        return audio;
      } catch (error) {
        console.warn(`Failed to load audio: ${soundName}`, error);
        return null;
      }
    },
    [enabled, volume],
  );

  const playSound = useCallback(
    (soundName, options = {}) => {
      if (!SOUND_FILES[soundName]) return;
      if (!enabled) return;
      const {
        volume: overrideVolume = volume,
        loop = false,
        onEnded = null,
      } = options;

      try {
        let audio = audioCache.current.get(soundName);
        if (!audio) {
          audio = loadAudio(soundName);
        }
        if (!audio) return;

        const pack = soundPackRef.current || DEFAULT_SOUND_PACK;
        const multiplier = pack.volumeMultiplier ?? 1;
        const audioClone = audio.cloneNode();
        audioClone.volume = Math.max(0, Math.min(1, overrideVolume * multiplier));
        audioClone.loop = loop;
        // playbackRate doubles as a rough pitch shift (1.0 = no change).
        audioClone.playbackRate = Math.max(0.5, 1 + (pack.pitchShift ?? 0));
        if (onEnded) {
          audioClone.addEventListener("ended", onEnded);
        }
        audioClone.play().catch((error) => {
          if (error.name !== "NotAllowedError") {
            console.warn(`Failed to play sound: ${soundName}`, error);
          }
        });
        return audioClone;
      } catch (error) {
        console.warn(`Error playing sound: ${soundName}`, error);
      }
    },
    [enabled, volume, loadAudio],
  );

  const stopSound = useCallback((audioInstance) => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
  }, []);

  const stopAllSounds = useCallback(() => {
    audioCache.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  useEffect(() => {
    audioCache.current.forEach((audio) => {
      audio.volume = volume;
    });
    localStorage.setItem("wordleplus_audio_volume", volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("wordleplus_audio_enabled", enabled.toString());
    if (!enabled) {
      stopAllSounds();
    }
  }, [enabled, stopAllSounds]);

  useEffect(() => {
    if (!enabled) return;
    const commonSounds = Object.keys(SOUND_FILES);
    commonSounds.forEach((sound) => loadAudio(sound));
  }, [enabled, loadAudio]);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      volume,
      setVolume,
      soundPack,
      setSoundPack,
      playSound,
      stopSound,
      stopAllSounds,
      loadAudio,
    }),
    [enabled, volume, soundPack, playSound, stopSound, stopAllSounds, loadAudio],
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error("useAudio must be used within AudioProvider");
  }
  return ctx;
}
