import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Flame,
  LayoutDashboard,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  X,
  Cloud,
  Send,
  Check,
  Wallet
} from 'lucide-react';
import { DayOfWeek } from '../types';
import { sendTelegramMessage, triggerHapticFeedback, sendWorkoutTelegramPing } from '../lib/telegram';

interface HeaderProps {
  currentDate: Date;
  activeTab: 'dashboard' | 'timetable' | 'assignments' | 'money';
  onTabChange: (tab: 'dashboard' | 'timetable' | 'assignments' | 'money') => void;
  onOpenFocusSprint: () => void;
  onOpenAddModal: () => void;
  completedTodayCount: number;
  // Simulation props
  isSimulating: boolean;
  simulatedDay: DayOfWeek | null;
  simulatedTimeMinutes: number | null;
  onApplySimulation: (day: DayOfWeek, minutes: number) => void;
  onResetSimulation: () => void;
  isFirebaseConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  activeTab,
  onTabChange,
  onOpenFocusSprint,
  onOpenAddModal,
  completedTodayCount,
  isSimulating,
  simulatedDay,
  simulatedTimeMinutes,
  onApplySimulation,
  onResetSimulation,
  isFirebaseConnected = true,
}) => {
  const [showSimModal, setShowSimModal] = useState(false);
  const [selectedSimDay, setSelectedSimDay] = useState<DayOfWeek>(1);
  const [selectedSimTime, setSelectedSimTime] = useState<string>('09:00');
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSendTelegramTest = async () => {
    if (telegramStatus === 'sending') return;
    setTelegramStatus('sending');
    triggerHapticFeedback('medium');
    const success = await sendTelegramMessage(
      `⚡ *LockIn Bot Test Notification*\n\n` +
      `Telegram Bot notifications are active and connected for ID \`2128817856\`!\n` +
      `Timestamp: ${new Date().toLocaleTimeString()}\n\n` +
      `_Status: Live & Locked In._`
    );
    if (success) {
      setTelegramStatus('sent');
      setTimeout(() => setTelegramStatus('idle'), 3000);
    } else {
      setTelegramStatus('idle');
    }
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[simulatedDay !== null ? simulatedDay : currentDate.getDay()];
  const monthName = months[currentDate.getMonth()];
  const dateNum = currentDate.getDate();

  // Format time display
  let timeDisplay = '';
  if (simulatedTimeMinutes !== null) {
    const hrs = Math.floor(simulatedTimeMinutes / 60);
    const mins = simulatedTimeMinutes % 60;
    const period = hrs >= 12 ? 'PM' : 'AM';
    const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
    timeDisplay = `${displayHrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period} (Sim)`;
  } else {
    timeDisplay = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  const handlePresetSim = (day: DayOfWeek, hours: number, minutes: number) => {
    onApplySimulation(day, hours * 60 + minutes);
    setShowSimModal(false);
  };

  const handleCustomSim = (e: React.FormEvent) => {
    e.preventDefault();
    const [h, m] = selectedSimTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      onApplySimulation(selectedSimDay, h * 60 + m);
      setShowSimModal(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#232B3E] bg-[#0B0F17]/95 backdrop-blur-md px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Live Clock */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <span className="text-emerald-400 font-bold text-sm tracking-tighter">LI</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-base tracking-tight">LockIn</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Execution
                </span>
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  title="Connected to Google Firebase (lock-in-4d28a)"
                >
                  <Cloud className="w-3 h-3 text-emerald-400 fill-emerald-400/20" />
                  <span>Firebase</span>
                </span>
                <button
                  type="button"
                  onClick={handleSendTelegramTest}
                  disabled={telegramStatus === 'sending'}
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors cursor-pointer"
                  title="Telegram Bot: 8988649214 -> ID 2128817856. Click to send test alert!"
                >
                  {telegramStatus === 'sent' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Send className="w-3 h-3 text-sky-400" />
                  )}
                  <span>
                    {telegramStatus === 'sending'
                      ? 'Sending...'
                      : telegramStatus === 'sent'
                      ? 'Sent!'
                      : 'Telegram'}
                  </span>
                </button>
                {isSimulating && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    Simulated Time
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Minimal High-Discipline System</p>
            </div>
          </div>

          {/* Clock & Action for Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="font-mono text-xs font-medium text-slate-200 bg-[#161B26] px-2.5 py-1.5 rounded-lg border border-[#232B3E]">
              {timeDisplay}
            </div>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-[#0B0F17] px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition-all shadow-sm"
              title="Add Assignment"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Center Navigation Tabs (Visible on tablet/desktop, mobile uses sleek BottomNav) */}
        <nav className="hidden md:flex items-center bg-[#161B26] p-1 rounded-xl border border-[#232B3E] text-xs font-medium overflow-x-auto max-w-full">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-[#232B3E] text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onTabChange('timetable')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'timetable'
                ? 'bg-[#232B3E] text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Master Schedule</span>
          </button>

          <button
            onClick={() => onTabChange('assignments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'assignments'
                ? 'bg-[#232B3E] text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
            <span>Deadlines & Calendar</span>
          </button>

          <button
            onClick={() => onTabChange('money')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'money'
                ? 'bg-[#232B3E] text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Money Tracker</span>
          </button>
        </nav>

        {/* Right Controls: Clock, Stats, Sprint Trigger, Simulation Toggle */}
        <div className="hidden md:flex items-center gap-3">
          {/* Live System Time Display */}
          <div className="flex items-center gap-2 bg-[#161B26] px-3 py-1.5 rounded-lg border border-[#232B3E] text-xs">
            <span className="text-slate-400">{dayName}, {monthName} {dateNum}</span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-emerald-400 font-medium tracking-tight">
              {timeDisplay}
            </span>
          </div>

          {/* Completed blocks counter */}
          <div className="flex items-center gap-1.5 bg-[#161B26] px-2.5 py-1.5 rounded-lg border border-[#232B3E] text-xs" title="Blocks completed today">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span className="text-slate-200 font-mono font-medium">{completedTodayCount}</span>
            <span className="text-slate-500 text-[11px]">done</span>
          </div>

          {/* Time simulation button */}
          <button
            onClick={() => setShowSimModal(!showSimModal)}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              isSimulating
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-[#161B26] border-[#232B3E] text-slate-400 hover:text-slate-200'
            }`}
            title="Simulate / Test Timetable Engine at any hour"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden lg:inline">{isSimulating ? 'Testing' : 'Clock Sim'}</span>
          </button>

          {/* Add Assignment CTA */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-[#161B26] hover:bg-[#232B3E] border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Assignment</span>
          </button>

          {/* Focus Sprint CTA */}
          <button
            onClick={onOpenFocusSprint}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#0B0F17] px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Focus Sprint</span>
          </button>
        </div>
      </div>

      {/* Simulation Modal / Drawer */}
      {showSimModal && (
        <div className="mt-3 p-4 bg-[#161B26] border border-[#232B3E] rounded-xl max-w-7xl mx-auto shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#232B3E]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100">Timetable Engine Clock Simulator</h3>
              <span className="text-xs text-slate-400">
                (Test the real-time engine with any time of day or day of week)
              </span>
            </div>
            <button
              onClick={() => setShowSimModal(false)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Quick Presets from Master Schedule:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePresetSim(1, 7, 15)}
                  className="px-2.5 py-1 text-xs bg-[#0B0F17] hover:bg-[#232B3E] border border-rose-500/30 rounded-lg text-rose-300 font-medium"
                >
                  🏋️ Mon 07:15 AM (Workout Block)
                </button>
                <button
                  onClick={() => handlePresetSim(1, 7, 45)}
                  className="px-2.5 py-1 text-xs bg-[#0B0F17] hover:bg-[#232B3E] border border-amber-500/30 rounded-lg text-amber-300"
                >
                  🍳 Mon 07:45 AM (Shower & Breakfast)
                </button>
                <button
                  onClick={() => handlePresetSim(1, 8, 45)}
                  className="px-2.5 py-1 text-xs bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] rounded-lg text-slate-300"
                >
                  Mon 08:45 AM (Cloud Computing)
                </button>
                <button
                  onClick={() => handlePresetSim(2, 8, 45)}
                  className="px-2.5 py-1 text-xs bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] rounded-lg text-slate-300"
                >
                  Tue 08:45 AM (Computer Science A)
                </button>
                <button
                  onClick={() => handlePresetSim(3, 10, 20)}
                  className="px-2.5 py-1 text-xs bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] rounded-lg text-slate-300"
                >
                  Wed 10:20 AM (Intro Psychology)
                </button>
                <button
                  onClick={() => handlePresetSim(5, 10, 25)}
                  className="px-2.5 py-1 text-xs bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] rounded-lg text-slate-300"
                >
                  Fri 10:25 AM (Java Programming)
                </button>
                <button
                  onClick={() => handlePresetSim(1, 15, 45)}
                  className="px-2.5 py-1 text-xs bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] rounded-lg text-slate-300"
                >
                  Mon 03:45 PM (Trading Hour)
                </button>
                <button
                  onClick={() => handlePresetSim(3, 17, 45)}
                  className="px-2.5 py-1 text-xs bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] rounded-lg text-slate-300"
                >
                  Wed 05:45 PM (Teach G8 Math)
                </button>
                <button
                  onClick={() => handlePresetSim(4, 22, 15)}
                  className="px-2.5 py-1 text-xs bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] rounded-lg text-slate-300"
                >
                  Thu 10:15 PM (Night Study)
                </button>
                <button
                  onClick={() => handlePresetSim(6, 14, 30)}
                  className="px-2.5 py-1 text-xs bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] rounded-lg text-slate-300"
                >
                  Sat 02:30 PM (Weekend Learn)
                </button>
              </div>
            </div>

            <form onSubmit={handleCustomSim} className="flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Custom Day & Time:</p>
                <div className="flex gap-2 mb-3">
                  <select
                    value={selectedSimDay}
                    onChange={(e) => setSelectedSimDay(Number(e.target.value) as DayOfWeek)}
                    className="bg-[#0B0F17] border border-[#232B3E] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={0}>Sunday</option>
                  </select>

                  <input
                    type="time"
                    value={selectedSimTime}
                    onChange={(e) => setSelectedSimTime(e.target.value)}
                    className="bg-[#0B0F17] border border-[#232B3E] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />

                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#0B0F17] rounded-lg text-xs font-semibold"
                  >
                    Simulate
                  </button>
                </div>

                <div className="pt-2 border-t border-[#232B3E]/60">
                  <button
                    type="button"
                    onClick={async () => {
                      triggerHapticFeedback('medium');
                      const sent = await sendWorkoutTelegramPing();
                      if (sent) {
                        alert('6:55 AM Workout Ping dispatched to all registered Telegram accounts (Primary: 2128817856 & Heng Huykeang: 957660223)!');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all"
                  >
                    <span>🏋️ Test 6:55 AM Workout Ping (Telegram)</span>
                  </button>
                </div>
              </div>

              {isSimulating && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetSimulation();
                      setShowSimModal(false);
                    }}
                    className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Real System Clock
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
