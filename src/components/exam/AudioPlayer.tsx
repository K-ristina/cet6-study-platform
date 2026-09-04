import React, { useRef, useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  ListMusic,
  Repeat,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Coffee,
  Volume2,
  Headphones,
} from "lucide-react";
import { LyricLine } from "../../types";

interface AudioPlayerProps {
  title?: string;
  audioUrl?: string;
  lyrics?: LyricLine[];
  seekTime?: number | null;
  onSeekHandled?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  title = "2023年12月英语六级听力真题原声",
  audioUrl,
  lyrics = [],
  seekTime,
  onSeekHandled,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(360);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [showLyricsDrawer, setShowLyricsDrawer] = useState<boolean>(false);

  // A-B repeat
  const [abPointA, setAbPointA] = useState<number | null>(null);
  const [abPointB, setAbPointB] = useState<number | null>(null);
  const [isAbLooping, setIsAbLooping] = useState<boolean>(false);

  const synthTimerRef = useRef<any>(null);

  useEffect(() => {
    if (seekTime !== undefined && seekTime !== null) {
      if (audioRef.current && audioRef.current.duration) {
        audioRef.current.currentTime = seekTime;
        if (!isPlaying) {
          audioRef.current.play().catch((e) => console.error(e));
          setIsPlaying(true);
        }
      } else {
        // Fallback for mock
        setCurrentTime(seekTime);
        setIsPlaying(true);
      }
      onSeekHandled?.();
    }
  }, [seekTime, onSeekHandled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))
        return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        skip(-5);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        skip(5);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        replayCurrentSentence();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, lyrics, currentTime]);

  useEffect(() => {
    if (audioUrl) {
      // Real audio is playing, handled by onTimeUpdate
      if (
        isPlaying &&
        isAbLooping &&
        abPointA !== null &&
        abPointB !== null &&
        currentTime >= abPointB
      ) {
        if (audioRef.current) {
          audioRef.current.currentTime = abPointA;
        }
      }
    } else {
      // Mock playback timer
      if (isPlaying) {
        synthTimerRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            const next = prev + 0.5 * playbackRate;
            if (
              isAbLooping &&
              abPointA !== null &&
              abPointB !== null &&
              next >= abPointB
            ) {
              return abPointA;
            }
            if (next >= duration) {
              setIsPlaying(false);
              return 0;
            }
            return next;
          });
        }, 500);
      } else {
        clearInterval(synthTimerRef.current);
      }
    }
    return () => clearInterval(synthTimerRef.current);
  }, [
    isPlaying,
    playbackRate,
    duration,
    isAbLooping,
    abPointA,
    abPointB,
    audioUrl,
    currentTime,
  ]);

  const togglePlay = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current
          .play()
          .catch((e) => console.error("Audio playback error:", e));
      }
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds: number) => {
    if (audioUrl && audioRef.current) {
      const newTime = Math.max(
        0,
        Math.min(
          audioRef.current.duration || duration,
          audioRef.current.currentTime + seconds,
        ),
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else {
      setCurrentTime((prev) => Math.max(0, Math.min(duration, prev + seconds)));
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const activeLyricIndex = lyrics.findIndex((line, idx) => {
    const nextLine = lyrics[idx + 1];
    return (
      currentTime >= line.time && (!nextLine || currentTime < nextLine.time)
    );
  });

  const replayCurrentSentence = () => {
    if (activeLyricIndex >= 0 && lyrics[activeLyricIndex]) {
      const targetTime = lyrics[activeLyricIndex].time;
      if (audioUrl && audioRef.current) {
        audioRef.current.currentTime = targetTime;
        audioRef.current.play().catch((e) => console.error(e));
      }
      setCurrentTime(targetTime);
      setIsPlaying(true);
    } else {
      skip(-5);
    }
  };

  const handleSetAB = () => {
    if (abPointA === null) {
      setAbPointA(currentTime);
    } else if (abPointB === null) {
      if (currentTime > abPointA) {
        setAbPointB(currentTime);
        setIsAbLooping(true);
      }
    } else {
      setAbPointA(null);
      setAbPointB(null);
      setIsAbLooping(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Real audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="relative z-30">
      {/* Main floating bar: Clean White Card with Starbucks Styling */}
      <div className="p-3 bg-sb-cool/50 dark:bg-white/[0.02] flex flex-col gap-2.5">
        {/* Row 1: Mode Badge & Title */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-sb-ceramic dark:bg-white/10 p-0.5 rounded-full text-xs font-bold">
            <span className="px-2.5 py-0.5 rounded-full bg-sb-accent text-white shadow-sm flex items-center space-x-1 text-[10px]">
              <Headphones className="w-3 h-3 mr-1" />
              <span>精听模式</span>
            </span>
          </div>

          <div className="truncate flex-1 text-right">
            <p className="text-[11px] font-bold text-sb-green dark:text-sb-mint truncate font-sans" title={title}>
              {title}
            </p>
          </div>
        </div>

        {/* Row 2: Play Controls */}
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => skip(-5)}
            title="快退 5 秒 (快捷键 ←)"
            className="p-1 rounded-full text-sb-text-soft hover:text-sb-green hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 text-xs font-medium flex items-center"
          >
            <Rewind className="w-3.5 h-3.5" />
            <span className="text-[10px] ml-0.5 font-bold">-5s</span>
          </button>

          {/* Circular Starbucks CTA Button (36px) */}
          <button
            onClick={togglePlay}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 shadow-sm active:scale-95 ${
              isPlaying
                ? "bg-sb-gold text-sb-house"
                : "bg-sb-accent hover:bg-sb-green text-white"
            }`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5 fill-white" />
            )}
          </button>

          <button
            onClick={() => skip(5)}
            title="快进 5 秒 (快捷键 →)"
            className="p-1 rounded-full text-sb-text-soft hover:text-sb-green hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 text-xs font-medium flex items-center"
          >
            <span className="text-[10px] mr-0.5 font-bold">+5s</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={replayCurrentSentence}
            title="重听当前句 (快捷键 R)"
            className="p-1 px-2 rounded-full text-sb-accent hover:bg-sb-mint/40 transition-all active:scale-95 text-xs font-bold flex items-center"
          >
            <RotateCcw className="w-3 h-3 mr-0.5" />
            <span className="text-[10px]">重听</span>
          </button>
        </div>

        {/* Row 3: Progress bar */}
        <div className="w-full flex items-center space-x-2">
          <span className="text-[10px] font-mono font-bold text-sb-text-soft shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 group">
            <input
              type="range"
              min={0}
              max={duration}
              step={0.5}
              value={currentTime}
              disabled={false}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTime(val);
                if (audioRef.current) {
                  audioRef.current.currentTime = val;
                }
              }}
              className="w-full h-1.5 bg-sb-ceramic dark:bg-white/20 rounded-full appearance-none cursor-pointer accent-sb-accent transition-all"
            />
            {abPointA !== null && (
              <div
                className="absolute top-0 w-2 h-3 bg-sb-gold rounded-full -translate-x-1/2 pointer-events-none"
                style={{ left: `${(abPointA / duration) * 100}%` }}
              />
            )}
            {abPointB !== null && (
              <div
                className="absolute top-0 w-2 h-3 bg-sb-accent rounded-full -translate-x-1/2 pointer-events-none"
                style={{ left: `${(abPointB / duration) * 100}%` }}
              />
            )}
          </div>
          <span className="text-[10px] font-mono text-sb-text-soft shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Row 4: Speed pills & A-B Repeat */}
        <div className="flex items-center justify-between pt-0.5">
          {/* Speed dropdown pill group */}
          <div className="flex items-center bg-sb-ceramic dark:bg-white/10 rounded-full p-0.5 text-xs">
            {[0.8, 1.0, 1.2, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 ${
                  playbackRate === spd
                    ? "bg-sb-accent text-white shadow-sm"
                    : "text-sb-text-soft dark:text-white/80 hover:text-sb-accent"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* A-B Loop Pill */}
          <button
            onClick={handleSetAB}
            className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 active:scale-95 ${
              isAbLooping
                ? "bg-sb-gold text-sb-house shadow-sm font-black"
                : abPointA !== null
                  ? "bg-sb-gold-lightest text-sb-green border border-sb-gold"
                  : "bg-sb-ceramic dark:bg-white/10 text-sb-text dark:text-white hover:bg-sb-mint/40"
            }`}
          >
            <Repeat className="w-3 h-3" />
            <span>
              {abPointA === null
                ? "A-B"
                : abPointB === null
                  ? "设B点"
                  : "循环中"}
            </span>
          </button>
        </div>
      </div>

      {/* Hidden real audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          preload="metadata"
        />
      )}
    </div>
  );
};
