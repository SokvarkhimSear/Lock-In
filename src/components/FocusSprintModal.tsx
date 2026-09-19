import React, { useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { soundEngine } from '../utils/timeEngine';

interface FocusSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBlockTitle: string;
  onLogCompletedSprint: (title: string, durationMinutes: number) => void;
}

export const FocusSprintModal: React.FC<FocusSprintModalProps> = ({
  isOpen,
  onClose,
  initialBlockTitle,
  onLogCompletedSprint,
}) => {
  const [taskName, setTaskName] = useState(initialBlockTitle);
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Update initial task name when prop changes
  useEffect(() => {
    if (initialBlockTitle) {
      setTaskName(initialBlockTitle);
    }
  }, [initialBlockTitle]);

  // Set timer duration
  const setDuration = (mins: number) => {
    setSelectedMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsRunning(false);
  };

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Completed!
            setIsRunning(false);
            soundEngine.playSuccessChime();
            onLogCompletedSprint(taskName, selectedMinutes);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining, taskName, selectedMinutes, onLogCompletedSprint]);

  // Ambient focus white/brown noise via Web Audio API
  useEffect(() => {
    if (isRunning && soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Generate gentle pink-brown noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.96 * b1 + white * 0.11;
          b2 = 0.86 * b2 + white * 0.25;
          data[i] = (b0 + b1 + b2) * 0.08;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.04, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start(0);
        noiseNodeRef.current = whiteNoise;
      } catch {}
    } else {
      if (noiseNodeRef.current) {
        try {
          (noiseNodeRef.current as AudioScheduledSourceNode).stop();
        } catch {}
        noiseNodeRef.current = null;
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
        audioCtxRef.current = null;
      }
    }

    return () => {
      if (noiseNodeRef.current) {
        try {
          (noiseNodeRef.current as AudioScheduledSourceNode).stop();
        } catch {}
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, [isRunning, soundEnabled]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPercent = Math.round(((selectedMinutes * 60 - secondsRemaining) / (selectedMinutes * 60)) * 100);

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-[#0B0F17] flex flex-col justify-between p-8 sm:p-14'
    : 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div
        className={
          isFullscreen
            ? 'w-full h-full max-w-4xl mx-auto flex flex-col justify-between'
            : 'bg-[#161B26] border border-[#232B3E] rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative'
        }
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#232B3E]/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-semibold tracking-wider text-emerald-400 uppercase">
              Focus Sprint Execution
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg text-xs border transition-colors ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-[#0B0F17] border-[#232B3E] text-slate-400 hover:text-slate-200'
              }`}
              title={soundEnabled ? 'Ambient Brown Noise On' : 'Ambient Brown Noise Off'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-[#0B0F17] border border-[#232B3E] text-slate-400 hover:text-slate-200 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Zen Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                setIsRunning(false);
                onClose();
              }}
              className="p-2 rounded-lg bg-[#0B0F17] border border-[#232B3E] text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Section: Task Name, Time Display, Progress Bar */}
        <div className="my-auto py-8 text-center flex flex-col items-center">
          {/* Target Task Name Input */}
          <div className="w-full max-w-md mb-6">
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="What are you locking into right now?"
              className="w-full text-center bg-transparent border-b border-[#232B3E] focus:border-emerald-500 text-slate-200 font-medium text-lg sm:text-xl py-1.5 focus:outline-none placeholder:text-slate-600 transition-colors"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 mb-8">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setDuration(mins)}
                disabled={isRunning}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  selectedMinutes === mins
                    ? 'bg-emerald-500 text-[#0B0F17] font-semibold'
                    : 'bg-[#0B0F17] text-slate-400 hover:text-slate-200 border border-[#232B3E]'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Big Monospace Digits */}
          <div className="font-mono text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter text-slate-100 my-2 select-none">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md h-2 bg-[#0B0F17] rounded-full overflow-hidden border border-[#232B3E] mt-4 mb-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-[11px] font-mono text-slate-500">{progressPercent}% complete</span>
        </div>

        {/* Primary Controls */}
        <div className="pt-6 border-t border-[#232B3E]/60 flex items-center justify-center gap-4">
          <button
            onClick={() => setSecondsRemaining(selectedMinutes * 60)}
            className="p-3 rounded-xl bg-[#0B0F17] text-slate-400 hover:text-slate-200 border border-[#232B3E] transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setIsRunning(!isRunning);
            }}
            className={`px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center gap-2.5 transition-all shadow-lg ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#0B0F17]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>PAUSE SPRINT</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>LOCK IN (START)</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              soundEngine.playSuccessChime();
              onLogCompletedSprint(taskName, Math.round((selectedMinutes * 60 - secondsRemaining) / 60) || selectedMinutes);
              onClose();
            }}
            className="p-3 rounded-xl bg-[#0B0F17] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-colors"
            title="Mark Completed Now"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
