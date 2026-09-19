import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  GraduationCap,
  Layers,
  MapPin,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { BlockCategory, DayOfWeek, ScheduleBlock } from '../types';
import { MASTER_SCHEDULE } from '../data/scheduleData';
import { formatTimeWindow, getCategoryBadge, getCurrentDayBlocks } from '../utils/timeEngine';

interface MasterTimetableProps {
  currentDay: DayOfWeek;
  currentMinutes: number;
  onSelectBlockForSprint: (title: string) => void;
}

export const MasterTimetable: React.FC<MasterTimetableProps> = ({
  currentDay,
  currentMinutes,
  onSelectBlockForSprint,
}) => {
  const [selectedDayTab, setSelectedDayTab] = useState<DayOfWeek>(currentDay);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const days: { index: DayOfWeek; name: string; short: string; isWeekend: boolean }[] = [
    { index: 1, name: 'Monday', short: 'Mon', isWeekend: false },
    { index: 2, name: 'Tuesday', short: 'Tue', isWeekend: false },
    { index: 3, name: 'Wednesday', short: 'Wed', isWeekend: false },
    { index: 4, name: 'Thursday', short: 'Thu', isWeekend: false },
    { index: 5, name: 'Friday', short: 'Fri', isWeekend: false },
    { index: 6, name: 'Saturday', short: 'Sat', isWeekend: true },
    { index: 0, name: 'Sunday', short: 'Sun', isWeekend: true },
  ];

  const blocksForDay = getCurrentDayBlocks(selectedDayTab);

  const filteredBlocks = blocksForDay.filter((block) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'class' && block.category === 'class') return true;
    if (categoryFilter === 'study' && (block.category === 'study' || block.category === 'night_study')) return true;
    if (categoryFilter === 'teaching' && block.category === 'teaching') return true;
    if (categoryFilter === 'trading' && block.category === 'trading') return true;
    if (categoryFilter === 'breaks' && (block.category === 'break' || block.category === 'chores' || block.category === 'free' || block.category === 'commute')) return true;
    return false;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Timetable Header & Overview */}
      <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <h2 className="text-base font-bold text-slate-100 tracking-tight">
              Master Execution Timetable (7-Day Blueprint)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Rigorous discipline routine for high performance across computer science, teaching, trading, and deep work.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center flex-wrap gap-1.5 bg-[#0B0F17] p-1 rounded-lg border border-[#232B3E] text-xs">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              categoryFilter === 'ALL' ? 'bg-[#232B3E] text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({blocksForDay.length})
          </button>
          <button
            onClick={() => setCategoryFilter('class')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              categoryFilter === 'class' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40' : 'text-slate-400'
            }`}
          >
            Classes
          </button>
          <button
            onClick={() => setCategoryFilter('study')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              categoryFilter === 'study' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/40' : 'text-slate-400'
            }`}
          >
            Study & Deep Work
          </button>
          <button
            onClick={() => setCategoryFilter('teaching')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              categoryFilter === 'teaching' ? 'bg-amber-950 text-amber-300 border border-amber-800/40' : 'text-slate-400'
            }`}
          >
            Teaching
          </button>
          <button
            onClick={() => setCategoryFilter('trading')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              categoryFilter === 'trading' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'text-slate-400'
            }`}
          >
            Trading
          </button>
        </div>
      </div>

      {/* 7-Day Selector Tabs */}
      <div className="grid grid-cols-7 gap-2 bg-[#161B26] p-1.5 rounded-xl border border-[#232B3E]">
        {days.map((d) => {
          const isSelected = selectedDayTab === d.index;
          const isToday = currentDay === d.index;

          return (
            <button
              key={d.index}
              onClick={() => setSelectedDayTab(d.index)}
              className={`py-3 px-2 rounded-lg text-center transition-all relative flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-[#232B3E] text-slate-100 shadow-md font-semibold border border-slate-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0B0F17]/60'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs tracking-tight">{d.short}</span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
                {d.isWeekend ? 'Weekend' : 'Weekday'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Schedule Detail Timeline / Cards */}
      <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#232B3E]">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100">
              {days.find((d) => d.index === selectedDayTab)?.name} Master Schedule
            </h3>
            {currentDay === selectedDayTab && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Today's Schedule
              </span>
            )}
          </div>

          <span className="text-xs font-mono text-slate-400">
            {filteredBlocks.length} scheduled time blocks
          </span>
        </div>

        {/* Timeline Blocks List */}
        <div className="space-y-3">
          {filteredBlocks.map((block, idx) => {
            const isLiveActive =
              currentDay === selectedDayTab &&
              currentMinutes >= block.startMinutes &&
              currentMinutes < block.endMinutes;

            const badge = getCategoryBadge(block.category);

            return (
              <div
                key={block.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative ${
                  isLiveActive
                    ? 'bg-[#1A2536] border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30'
                    : 'bg-[#0B0F17] border-[#232B3E] hover:border-slate-700'
                }`}
              >
                {/* Left side: Time & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                  {/* Time badge */}
                  <div className="w-full sm:w-36 shrink-0">
                    <div className="font-mono text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatTimeWindow(block.startTime, block.endTime)}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {block.endMinutes - block.startMinutes} mins duration
                    </span>
                  </div>

                  {/* Block Title & Details */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {block.courseCode && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                          {block.courseCode}
                        </span>
                      )}

                      <h4 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight">
                        {block.title}
                      </h4>

                      {isLiveActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          LIVE NOW
                        </span>
                      )}
                    </div>

                    {block.locationOrDetails && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{block.locationOrDetails}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Category & Sprint trigger */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#232B3E]/60">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${badge.border} ${badge.bg} ${badge.color}`}>
                    {badge.label}
                  </span>

                  <button
                    onClick={() => onSelectBlockForSprint(block.title)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#161B26] hover:bg-[#232B3E] text-slate-300 hover:text-emerald-400 border border-[#232B3E] transition-colors"
                  >
                    Sprint
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
