import { DayOfWeek, ScheduleBlock } from '../types';
import { MASTER_SCHEDULE } from '../data/scheduleData';

export interface CurrentFlowStatus {
  currentBlock: ScheduleBlock | null;
  nextBlock: ScheduleBlock | null;
  progressPercent: number;
  minutesRemaining: number;
  minutesElapsed: number;
  totalBlockMinutes: number;
  isOffSchedule: boolean;
  isBeforeSchedule: boolean;
  isAfterSchedule: boolean;
  currentDayIndex: DayOfWeek;
  currentMinutes: number;
}

export function getCurrentDayBlocks(dayIndex: DayOfWeek): ScheduleBlock[] {
  return MASTER_SCHEDULE
    .filter((block) => block.days.includes(dayIndex))
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

export function calculateFlowStatus(
  currentDate: Date,
  customDayOverride?: DayOfWeek,
  customMinutesOverride?: number
): CurrentFlowStatus {
  const dayIndex = (customDayOverride !== undefined ? customDayOverride : currentDate.getDay()) as DayOfWeek;
  const currentMinutes = customMinutesOverride !== undefined
    ? customMinutesOverride
    : currentDate.getHours() * 60 + currentDate.getMinutes();

  const todayBlocks = getCurrentDayBlocks(dayIndex);

  if (todayBlocks.length === 0) {
    return {
      currentBlock: null,
      nextBlock: null,
      progressPercent: 0,
      minutesRemaining: 0,
      minutesElapsed: 0,
      totalBlockMinutes: 0,
      isOffSchedule: true,
      isBeforeSchedule: false,
      isAfterSchedule: false,
      currentDayIndex: dayIndex,
      currentMinutes,
    };
  }

  const firstBlock = todayBlocks[0];
  const lastBlock = todayBlocks[todayBlocks.length - 1];

  // Check if currently inside a block
  const activeBlock = todayBlocks.find(
    (b) => currentMinutes >= b.startMinutes && currentMinutes < b.endMinutes
  );

  if (activeBlock) {
    const totalBlockMinutes = activeBlock.endMinutes - activeBlock.startMinutes;
    const minutesElapsed = currentMinutes - activeBlock.startMinutes;
    const minutesRemaining = activeBlock.endMinutes - currentMinutes;
    const progressPercent = Math.min(100, Math.max(0, Math.round((minutesElapsed / totalBlockMinutes) * 100)));

    // Next block is the block strictly after this active block
    const activeIndex = todayBlocks.findIndex((b) => b.id === activeBlock.id);
    const nextBlock = activeIndex < todayBlocks.length - 1 ? todayBlocks[activeIndex + 1] : null;

    return {
      currentBlock: activeBlock,
      nextBlock,
      progressPercent,
      minutesRemaining,
      minutesElapsed,
      totalBlockMinutes,
      isOffSchedule: false,
      isBeforeSchedule: false,
      isAfterSchedule: false,
      currentDayIndex: dayIndex,
      currentMinutes,
    };
  }

  // Not in an active block: Check if before the first block
  if (currentMinutes < firstBlock.startMinutes) {
    const minutesRemaining = firstBlock.startMinutes - currentMinutes;
    return {
      currentBlock: null,
      nextBlock: firstBlock,
      progressPercent: 0,
      minutesRemaining,
      minutesElapsed: 0,
      totalBlockMinutes: 0,
      isOffSchedule: true,
      isBeforeSchedule: true,
      isAfterSchedule: false,
      currentDayIndex: dayIndex,
      currentMinutes,
    };
  }

  // Check if between blocks
  const upcomingBlock = todayBlocks.find((b) => b.startMinutes > currentMinutes);
  if (upcomingBlock) {
    const minutesRemaining = upcomingBlock.startMinutes - currentMinutes;
    return {
      currentBlock: null,
      nextBlock: upcomingBlock,
      progressPercent: 0,
      minutesRemaining,
      minutesElapsed: 0,
      totalBlockMinutes: 0,
      isOffSchedule: true,
      isBeforeSchedule: false,
      isAfterSchedule: false,
      currentDayIndex: dayIndex,
      currentMinutes,
    };
  }

  // After schedule for the day (e.g. past midnight or between 00:00 and 08:00)
  // Look ahead to next day's first block
  const nextDay = ((dayIndex + 1) % 7) as DayOfWeek;
  const nextDayBlocks = getCurrentDayBlocks(nextDay);
  const nextMorningBlock = nextDayBlocks[0] || null;

  return {
    currentBlock: null,
    nextBlock: nextMorningBlock,
    progressPercent: 100,
    minutesRemaining: 0,
    minutesElapsed: 0,
    totalBlockMinutes: 0,
    isOffSchedule: true,
    isBeforeSchedule: false,
    isAfterSchedule: true,
    currentDayIndex: dayIndex,
    currentMinutes,
  };
}

export function formatMinutesToTime(minutes: number): string {
  const normalized = (minutes + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
}

export function formatTimeWindow(start: string, end: string): string {
  return `${start} – ${end}`;
}

export function getCategoryBadge(category: string): { label: string; color: string; border: string; bg: string } {
  switch (category) {
    case 'class':
      return { label: 'Lecture / Lab', color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-950/40' };
    case 'study':
      return { label: 'Study / Learn', color: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-950/40' };
    case 'night_study':
      return { label: 'Night Deep Work', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-950/40' };
    case 'trading':
      return { label: 'Trading & Markets', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/40' };
    case 'teaching':
      return { label: 'Teaching & Tutoring', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/40' };
    case 'break':
      return { label: 'Rest & Refresh', color: 'text-teal-400', border: 'border-teal-500/30', bg: 'bg-teal-950/40' };
    case 'commute':
      return { label: 'Transit', color: 'text-slate-400', border: 'border-slate-500/30', bg: 'bg-slate-800/40' };
    case 'chores':
      return { label: 'Chores & Meals', color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-950/40' };
    case 'free':
      return { label: 'Free Time', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/40' };
    default:
      return { label: 'Activity', color: 'text-slate-300', border: 'border-slate-600/30', bg: 'bg-slate-800/40' };
  }
}

// Subtle Web Audio synthesizer for focus chimes & completion
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playSuccessChime(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Two-note harmonic chime (E5 -> B5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.15); // B5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.5, now + 0.08); // E6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch {
      // Audio not supported or blocked by policy
    }
  }

  playClick(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }
}

export const soundEngine = new SoundEngine();

/**
 * Target Timezone for user scheduling & notifications (Asia/Phnom_Penh / Indochina Time UTC+7)
 */
export const USER_TIMEZONE = 'Asia/Phnom_Penh';

/**
 * Formats a Date object into a local 'YYYY-MM-DD' string without UTC timezone shift.
 */
export function formatLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a 24-hour time string ("HH:mm") into a 12-hour formatted time (e.g. "07:00 PM" or "11:59 PM").
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Safely parses dueDate ("YYYY-MM-DD") and dueTime ("HH:mm") into a formatted string
 * explicitly in Asia/Phnom_Penh (UTC+7 / ICT), avoiding browser-to-UTC corruption.
 */
export function formatDueDateTimeICT(dueDate: string, dueTime?: string): string {
  if (!dueDate) return '';
  const cleanTime = dueTime && dueTime.includes(':') ? dueTime : '23:59';
  const [yearStr, monthStr, dayStr] = dueDate.split('-');
  const [hourStr, minuteStr] = cleanTime.split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10) || 0;
  const minute = parseInt(minuteStr, 10) || 0;

  // Create Date representing this calendar moment
  const dateObj = new Date(year, month, day, hour, minute, 0);

  // Format with explicit Asia/Phnom_Penh time zone
  try {
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      timeZone: USER_TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const formattedTime = dateObj.toLocaleTimeString('en-US', {
      timeZone: USER_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return `${formattedDate} at ${formattedTime} (ICT)`;
  } catch {
    // Fallback if environment doesn't recognize specific IANA name
    const d = new Date(year, month, day, hour, minute, 0);
    const datePart = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart} at ${timePart} (UTC+7)`;
  }
}

/**
 * Parses a dueDate (YYYY-MM-DD) and dueTime (HH:mm) into a UTC epoch timestamp
 * based strictly on Asia/Phnom_Penh (UTC+7 / ICT) calendar time.
 */
export function getDueTimestampICT(dueDate: string, dueTime?: string): number {
  if (!dueDate) return 0;
  const cleanTime = dueTime && dueTime.includes(':') ? dueTime : '23:59';
  const [yearStr, monthStr, dayStr] = dueDate.split('-');
  const [hourStr, minuteStr] = cleanTime.split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10) || 0;
  const minute = parseInt(minuteStr, 10) || 0;

  if (isNaN(year) || isNaN(month) || isNaN(day)) return 0;

  // Since Asia/Phnom_Penh is fixed at UTC+7 with no daylight saving time:
  // Local time = UTC + 7 hours -> UTC = Local time - 7 hours
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute, 0, 0) - (7 * 60 * 60 * 1000);
  return utcMillis;
}

/**
 * Calculates remaining minutes until the assignment deadline based on ICT time.
 * Returns null if invalid.
 */
export function getMinutesUntilDue(dueDate: string, dueTime?: string, referenceDate: Date = new Date()): number | null {
  const targetEpoch = getDueTimestampICT(dueDate, dueTime);
  if (!targetEpoch) return null;

  const diffMs = targetEpoch - referenceDate.getTime();
  return diffMs / (60 * 1000);
}

