import React from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Play,
  PlusCircle,
  Timer,
  Zap,
  ArrowRight,
  Moon,
  Sparkles
} from 'lucide-react';
import { ScheduleBlock } from '../types';
import { CurrentFlowStatus, formatTimeWindow, getCategoryBadge, soundEngine } from '../utils/timeEngine';

interface TodayFlowProps {
  flowStatus: CurrentFlowStatus;
  todayBlocks: ScheduleBlock[];
  onMarkCompleted: (block: ScheduleBlock) => void;
  onExtendBlock: (block: ScheduleBlock, extraMinutes: number) => void;
  onStartFocusSprint: (blockTitle: string) => void;
  isBlockCompleted: (blockId: string) => boolean;
}

export const TodayFlow: React.FC<TodayFlowProps> = ({
  flowStatus,
  todayBlocks,
  onMarkCompleted,
  onExtendBlock,
  onStartFocusSprint,
  isBlockCompleted,
}) => {
  const { currentBlock, nextBlock, progressPercent, minutesRemaining, isOffSchedule, isBeforeSchedule, isAfterSchedule } = flowStatus;

  const currentBadge = currentBlock ? getCategoryBadge(currentBlock.category) : null;
  const nextBadge = nextBlock ? getCategoryBadge(nextBlock.category) : null;
  const isCurrentDone = currentBlock ? isBlockCompleted(currentBlock.id) : false;

  // Calculate day progress
  const totalBlocks = todayBlocks.length;
  const completedBlocksCount = todayBlocks.filter((b) => isBlockCompleted(b.id)).length;

  return (
    <section className="mb-8">
      {/* Top Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Today's Flow — Real-Time Engine
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          <span className="text-slate-300 font-semibold">{completedBlocksCount}</span>
          <span className="text-slate-500"> / </span>
          <span>{totalBlocks} Blocks Completed</span>
        </div>
      </div>

      {/* Grid: NOW Active Card (2 cols) & UP NEXT Card (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* NOW Active Block Card */}
        <div className="lg:col-span-7 bg-[#161B26] border border-[#232B3E] rounded-xl p-5 relative overflow-hidden shadow-lg flex flex-col justify-between">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div>
            {/* Card Header Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  NOW ACTIVE
                </span>

                {currentBadge && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${currentBadge.border} ${currentBadge.bg} ${currentBadge.color}`}>
                    {currentBadge.label}
                  </span>
                )}
              </div>

              {currentBlock && (
                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-[#0B0F17] px-2.5 py-1 rounded-md border border-[#232B3E]">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatTimeWindow(currentBlock.startTime, currentBlock.endTime)}</span>
                </div>
              )}
            </div>

            {/* Block Body Content */}
            {currentBlock ? (
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-1.5">
                  {currentBlock.courseCode && (
                    <span className="text-xs font-mono font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                      {currentBlock.courseCode}
                    </span>
                  )}
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                    {currentBlock.title}
                  </h3>
                </div>

                {currentBlock.locationOrDetails && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentBlock.locationOrDetails}</span>
                  </div>
                )}

                {/* Progress Bar & Countdown Display */}
                <div className="mt-5 pt-4 border-t border-[#232B3E]/60">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Timer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        <strong className="text-slate-200 font-mono text-sm">{minutesRemaining}m</strong> remaining in block
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-xs">
                      {progressPercent}% elapsed
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2.5 bg-[#0B0F17] rounded-full overflow-hidden border border-[#232B3E]">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              /* Between Blocks or Off-Schedule State */
              <div className="py-6 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                    {isAfterSchedule ? (
                      <Moon className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">
                      {isBeforeSchedule
                        ? 'Morning Buffer Window'
                        : isAfterSchedule
                        ? 'Schedule Concluded — Night Recovery'
                        : 'Between Scheduled Blocks'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isBeforeSchedule
                        ? 'Prepare your materials for the first session of the day.'
                        : isAfterSchedule
                        ? 'All master schedule blocks completed. Rest or review personal goals.'
                        : 'Use this buffer for hydration, mental reset, or checking assignments.'}
                    </p>
                  </div>
                </div>

                {nextBlock && (
                  <div className="bg-[#0B0F17] p-3 rounded-lg border border-[#232B3E] text-xs text-slate-300 flex items-center justify-between mt-2">
                    <span className="text-slate-400">Next scheduled block starts in:</span>
                    <span className="font-mono font-semibold text-amber-400">{minutesRemaining} minutes</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="pt-3 border-t border-[#232B3E] flex flex-wrap items-center gap-2">
            {currentBlock ? (
              <>
                <button
                  onClick={() => {
                    soundEngine.playSuccessChime();
                    onMarkCompleted(currentBlock);
                  }}
                  disabled={isCurrentDone}
                  className={`flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold transition-all ${
                    isCurrentDone
                      ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 cursor-default'
                      : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#0B0F17]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isCurrentDone ? 'Completed' : 'Mark Completed'}</span>
                </button>

                <button
                  onClick={() => onExtendBlock(currentBlock, 15)}
                  className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium bg-[#0B0F17] hover:bg-[#232B3E] text-slate-300 border border-[#232B3E] transition-colors"
                  title="Add 15 minutes extension buffer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Extend (+15m)</span>
                </button>

                <button
                  onClick={() => onStartFocusSprint(currentBlock.title)}
                  className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium bg-[#0B0F17] hover:bg-[#232B3E] text-slate-300 border border-[#232B3E] transition-colors sm:ml-auto"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                  <span>Focus Sprint</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onStartFocusSprint(nextBlock ? `Prep: ${nextBlock.title}` : 'Unscheduled Focus Sprint')}
                className="flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#0B0F17] transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Start Open Focus Sprint</span>
              </button>
            )}
          </div>
        </div>

        {/* UP NEXT Preview Card */}
        <div className="lg:col-span-5 bg-[#161B26] border border-[#232B3E] rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            {/* Card Header Status */}
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <ArrowRight className="w-3 h-3 text-amber-400" />
                UP NEXT
              </span>

              {nextBlock && (
                <div className="font-mono text-xs text-slate-400 bg-[#0B0F17] px-2 py-1 rounded-md border border-[#232B3E]">
                  {formatTimeWindow(nextBlock.startTime, nextBlock.endTime)}
                </div>
              )}
            </div>

            {/* Next Block Info */}
            {nextBlock ? (
              <div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  {nextBlock.courseCode && (
                    <span className="text-xs font-mono font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                      {nextBlock.courseCode}
                    </span>
                  )}
                  <h4 className="text-lg font-bold text-slate-100 tracking-tight">
                    {nextBlock.title}
                  </h4>
                </div>

                {nextBlock.locationOrDetails && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{nextBlock.locationOrDetails}</span>
                  </div>
                )}

                <div className="mt-4 p-3 bg-[#0B0F17] rounded-lg border border-[#232B3E] text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Context Prep:</span>
                    <span className="font-medium text-emerald-400">
                      {nextBadge?.label || 'Scheduled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Mental prep tip: Clear browser tabs, ensure necessary course materials or notes are open.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">
                <p className="text-xs font-medium text-slate-300">No further blocks scheduled for today</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  You've reached the end of today's master timetable. Great execution!
                </p>
              </div>
            )}
          </div>

          {/* Quick Prep Actions */}
          {nextBlock && (
            <div className="pt-3 mt-4 border-t border-[#232B3E] flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">
                {nextBlock.startTime} Start Slot
              </span>
              <button
                onClick={() => onStartFocusSprint(`Prep: ${nextBlock.title}`)}
                className="flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition-colors font-medium text-xs"
              >
                <span>Pre-load Sprint</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
