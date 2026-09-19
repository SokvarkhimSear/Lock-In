import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Assignment } from '../types';
import { formatLocalDateStr, formatTime12h } from '../utils/timeEngine';

interface DeadlineCalendarProps {
  assignments: Assignment[];
  onSelectDate: (dateString: string) => void;
  onOpenAddModal: (dateString?: string) => void;
  todayDate?: Date;
}

export const DeadlineCalendar: React.FC<DeadlineCalendarProps> = ({
  assignments,
  onSelectDate,
  onOpenAddModal,
  todayDate,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(() => todayDate || new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const nextD = new Date(currentDate);
      nextD.setDate(nextD.getDate() - 7);
      setCurrentDate(nextD);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const nextD = new Date(currentDate);
      nextD.setDate(nextD.getDate() + 7);
      setCurrentDate(nextD);
    }
  };

  const jumpToToday = () => {
    setCurrentDate(todayDate || new Date());
  };

  // Build days for month view
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map of assignments by date (YYYY-MM-DD)
  const assignmentsByDate: Record<string, Assignment[]> = {};
  assignments.forEach((asg) => {
    if (!assignmentsByDate[asg.dueDate]) {
      assignmentsByDate[asg.dueDate] = [];
    }
    assignmentsByDate[asg.dueDate].push(asg);
  });

  const todayStr = formatLocalDateStr(todayDate || new Date());

  // Generate month cells
  const renderMonthCells = () => {
    const cells = [];

    // Prev month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      const dayAssignments = assignmentsByDate[dateStr] || [];

      cells.push(
        <div
          key={`prev-${dayNum}`}
          onClick={() => onSelectDate(dateStr)}
          className="min-h-[58px] sm:min-h-[84px] p-1.5 sm:p-2 bg-[#0E131E]/40 border border-[#232B3E]/40 opacity-40 hover:opacity-80 transition-opacity cursor-pointer flex flex-col justify-between group"
        >
          <span className="text-[11px] sm:text-xs text-slate-500 font-mono">{dayNum}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {dayAssignments.map((a) => (
              <span
                key={a.id}
                className={`w-2 h-2 rounded-full ${
                  a.priority === 'high' ? 'bg-rose-500' : a.priority === 'medium' ? 'bg-blue-400' : 'bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      );
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const dayAssignments = assignmentsByDate[dateStr] || [];

      cells.push(
        <div
          key={`curr-${dayNum}`}
          onClick={() => onSelectDate(dateStr)}
          className={`min-h-[64px] sm:min-h-[86px] p-1.5 sm:p-2 border transition-all cursor-pointer flex flex-col justify-between group relative ${
            isToday
              ? 'bg-[#1A2234] border-emerald-500/50 shadow-inner'
              : 'bg-[#161B26] border-[#232B3E] hover:border-slate-600 hover:bg-[#1C2333]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-mono font-medium ${
                isToday
                  ? 'w-5 h-5 rounded-full bg-emerald-500 text-[#0B0F17] flex items-center justify-center font-bold'
                  : 'text-slate-300'
              }`}
            >
              {dayNum}
            </span>

            {/* Quick add trigger on hover or touch */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAddModal(dateStr);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-emerald-400 hover:bg-[#232B3E] transition-all"
              title="Add assignment for this day"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Assignments items/dots */}
          <div className="space-y-1 mt-1">
            {/* Desktop: small preview pill */}
            <div className="hidden sm:block space-y-1">
              {dayAssignments.slice(0, 2).map((a) => (
                <div
                  key={a.id}
                  className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 border ${
                    a.isCompleted
                      ? 'line-through text-slate-500 border-slate-800 bg-slate-900/40'
                      : a.priority === 'high'
                      ? 'text-rose-300 border-rose-500/30 bg-rose-950/40'
                      : a.priority === 'medium'
                      ? 'text-blue-300 border-blue-500/30 bg-blue-950/40'
                      : 'text-slate-300 border-slate-700 bg-slate-800/40'
                  }`}
                  title={`${a.courseCode}: ${a.title} (${a.dueTime})`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      a.isCompleted
                        ? 'bg-slate-500'
                        : a.priority === 'high'
                        ? 'bg-rose-400'
                        : a.priority === 'medium'
                        ? 'bg-blue-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="truncate">{a.title}</span>
                </div>
              ))}
              {dayAssignments.length > 2 && (
                <span className="text-[9px] font-mono text-slate-400 pl-1 block">
                  +{dayAssignments.length - 2} more
                </span>
              )}
            </div>

            {/* Mobile: clean colored dots */}
            <div className="sm:hidden flex flex-wrap gap-1 mt-1">
              {dayAssignments.map((a) => (
                <span
                  key={a.id}
                  className={`w-2 h-2 rounded-full ${
                    a.isCompleted
                      ? 'bg-slate-600'
                      : a.priority === 'high'
                      ? 'bg-rose-400'
                      : a.priority === 'medium'
                      ? 'bg-blue-400'
                      : 'bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return cells;
  };

  // Generate week cells for week view
  const renderWeekCells = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const dayAssignments = assignmentsByDate[dateStr] || [];

      weekDays.push(
        <div
          key={dateStr}
          onClick={() => onSelectDate(dateStr)}
          className={`min-h-[140px] sm:min-h-[180px] p-3 border rounded-xl transition-all cursor-pointer flex flex-col justify-between group ${
            isToday
              ? 'bg-[#1A2234] border-emerald-500/50 shadow-md'
              : 'bg-[#161B26] border-[#232B3E] hover:border-slate-600'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#232B3E]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">{dayLabels[i]}</span>
                <span
                  className={`text-sm font-mono font-bold ${
                    isToday
                      ? 'w-6 h-6 rounded-full bg-emerald-500 text-[#0B0F17] flex items-center justify-center'
                      : 'text-slate-200'
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddModal(dateStr);
                }}
                className="p-1.5 rounded text-slate-400 hover:text-emerald-400 hover:bg-[#232B3E] transition-all"
                title="Add assignment"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of assignments */}
            <div className="mt-3 space-y-1.5">
              {dayAssignments.length === 0 ? (
                <p className="text-[11px] text-slate-600 italic py-1">No deadlines</p>
              ) : (
                dayAssignments.map((a) => (
                  <div
                    key={a.id}
                    className={`p-2 rounded-lg text-xs border ${
                      a.isCompleted
                        ? 'line-through text-slate-500 border-slate-800 bg-slate-900/40'
                        : a.priority === 'high'
                        ? 'text-rose-200 border-rose-500/30 bg-rose-950/30'
                        : a.priority === 'medium'
                        ? 'text-blue-200 border-blue-500/30 bg-blue-950/30'
                        : 'text-slate-200 border-slate-700 bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-semibold opacity-80">{a.courseCode}</span>
                      <span className="font-mono text-[10px]">{formatTime12h(a.dueTime) || a.dueTime}</span>
                    </div>
                    <p className="font-medium truncate">{a.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">{weekDays}</div>;
  };

  return (
    <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-lg">
      {/* Calendar Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-[#0B0F17] border border-[#232B3E] rounded-lg p-1 min-h-[38px]">
            <button
              type="button"
              onClick={prevPeriod}
              className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-[#232B3E] transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextPeriod}
              className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-[#232B3E] transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight">
            {monthNames[month]} {year}
          </h3>

          <button
            type="button"
            onClick={jumpToToday}
            className="px-2.5 py-1.5 min-h-[38px] rounded-lg text-xs font-mono font-medium text-slate-300 bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] transition-colors"
          >
            Today
          </button>
        </div>

        {/* Right side: View mode toggle & Prominent Add Assignment button */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Priority Legend (hidden on small mobile to save space) */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-400 mr-2 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> Med
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> Low
            </span>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-[#0B0F17] border border-[#232B3E] rounded-lg p-0.5 text-xs min-h-[38px]">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                viewMode === 'month' ? 'bg-[#232B3E] text-slate-100 font-semibold' : 'text-slate-400'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                viewMode === 'week' ? 'bg-[#232B3E] text-slate-100 font-semibold' : 'text-slate-400'
              }`}
            >
              Week
            </button>
          </div>

          {/* Prominent + Add Assignment Button */}
          <button
            type="button"
            onClick={() => onOpenAddModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#0B0F17] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Assignment</span>
          </button>
        </div>
      </div>

      {/* Day of week headers (for Month view) */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-px mb-1 text-center font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-1.5 bg-[#0B0F17] rounded-t-lg border-x border-t border-[#232B3E]">
          {dayLabels.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-7 gap-px bg-[#232B3E] border border-[#232B3E] rounded-b-lg overflow-hidden">
          {renderMonthCells()}
        </div>
      ) : (
        renderWeekCells()
      )}
    </div>
  );
};
