import React, { useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Clock,
  Edit2,
  ListFilter,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Assignment } from '../types';
import { formatLocalDateStr, soundEngine } from '../utils/timeEngine';

interface AssignmentListProps {
  assignments: Assignment[];
  onToggleComplete: (id: string) => void;
  onDeleteAssignment: (id: string) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onOpenAddModal: () => void;
  todayDate?: Date;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  onToggleComplete,
  onDeleteAssignment,
  onEditAssignment,
  onOpenAddModal,
  todayDate,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');

  const now = todayDate || new Date();
  const todayStr = formatLocalDateStr(now);
  const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextWeekDate = new Date(todayDateObj);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);

  // Filter list
  const filtered = assignments.filter((a) => {
    if (activeTab === 'active' && a.isCompleted) return false;
    if (activeTab === 'completed' && !a.isCompleted) return false;
    if (courseFilter !== 'ALL' && a.courseCode !== courseFilter) return false;
    return true;
  });

  // Group active assignments chronologically
  const dueToday: Assignment[] = [];
  const dueThisWeek: Assignment[] = [];
  const dueLater: Assignment[] = [];

  if (activeTab === 'active') {
    filtered.forEach((asg) => {
      const asgDate = new Date(`${asg.dueDate}T00:00:00`);
      if (asg.dueDate === todayStr || asgDate <= todayDateObj) {
        dueToday.push(asg);
      } else if (asgDate <= nextWeekDate) {
        dueThisWeek.push(asg);
      } else {
        dueLater.push(asg);
      }
    });
  }

  // Extract unique courses for filter dropdown
  const uniqueCourses = Array.from(new Set(assignments.map((a) => a.courseCode)));

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      soundEngine.playSuccessChime();
    }
    onToggleComplete(id);
  };

  const renderAssignmentCard = (asg: Assignment) => {
    const isHigh = asg.priority === 'high';
    const isMed = asg.priority === 'medium';

    return (
      <div
        key={asg.id}
        className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 group ${
          asg.isCompleted
            ? 'bg-[#0B0F17]/60 border-[#232B3E] opacity-60'
            : 'bg-[#161B26] border-[#232B3E] hover:border-slate-600 shadow-sm'
        }`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Custom Checkbox Toggle - Min 44px tap zone on mobile */}
          <button
            type="button"
            onClick={() => handleToggle(asg.id, asg.isCompleted)}
            className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
              asg.isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-[#0B0F17]'
                : 'border-slate-600 hover:border-emerald-500 bg-[#0B0F17]'
            }`}
            title={asg.isCompleted ? 'Mark as active' : 'Mark as completed'}
          >
            {asg.isCompleted && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                {asg.courseCode}
              </span>

              {/* Priority Dot & Label */}
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1.5 border ${
                  isHigh
                    ? 'text-rose-300 border-rose-500/30 bg-rose-950/40 font-semibold'
                    : isMed
                    ? 'text-blue-300 border-blue-500/30 bg-blue-950/40'
                    : 'text-slate-400 border-slate-700 bg-slate-800/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isHigh ? 'bg-rose-500' : isMed ? 'bg-blue-400' : 'bg-slate-400'
                  }`}
                />
                {isHigh ? 'High' : isMed ? 'Medium' : 'Low'}
              </span>

              {/* Due Date & Time */}
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1 ml-auto">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{asg.dueDate}</span>
                <span className="text-slate-600">@</span>
                <span className="text-slate-200 font-semibold">{asg.dueTime}</span>
              </span>
            </div>

            <h4
              className={`text-sm sm:text-base font-semibold tracking-tight ${
                asg.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
              }`}
            >
              {asg.title}
            </h4>

            {asg.description && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed break-words">
                {asg.description}
              </p>
            )}
          </div>
        </div>

        {/* Card Actions (Edit, Delete) - Fully visible on touch/mobile */}
        <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#232B3E]/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => onEditAssignment(asg)}
            className="p-2 min-h-[38px] min-w-[38px] rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#232B3E] active:bg-[#2A344A] transition-colors flex items-center justify-center"
            title="Edit Assignment"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteAssignment(asg.id)}
            className="p-2 min-h-[38px] min-w-[38px] rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#232B3E] active:bg-rose-950/40 transition-colors flex items-center justify-center"
            title="Delete Assignment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
      {/* Top List Header & Controls */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#232B3E]">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Assignments & Deadlines</span>
            </h3>

            {/* Active / Completed Tabs */}
            <div className="flex items-center bg-[#0B0F17] border border-[#232B3E] rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-2.5 py-1 min-h-[30px] rounded-md transition-colors ${
                  activeTab === 'active'
                    ? 'bg-[#232B3E] text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Active ({assignments.filter((a) => !a.isCompleted).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-2.5 py-1 min-h-[30px] rounded-md transition-colors ${
                  activeTab === 'completed'
                    ? 'bg-[#232B3E] text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Archived ({assignments.filter((a) => a.isCompleted).length})
              </button>
            </div>
          </div>

          {/* Right Action: Filter & Prominent Add Button */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            {uniqueCourses.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#0B0F17] border border-[#232B3E] rounded-lg px-2.5 py-1.5 text-xs min-h-[36px]">
                <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Courses</option>
                  {uniqueCourses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Prominent + Add Assignment Button */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#0B0F17] transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Assignment</span>
            </button>
          </div>
        </div>

        {/* Content Grouping */}
        <div className="mt-4 space-y-5">
          {activeTab === 'active' ? (
            <>
              {/* Due Today */}
              {dueToday.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <h4 className="text-xs font-mono font-semibold text-rose-400 uppercase tracking-wider">
                      Due Today / Immediate ({dueToday.length})
                    </h4>
                  </div>
                  <div className="space-y-2">{dueToday.map(renderAssignmentCard)}</div>
                </div>
              )}

              {/* Due This Week */}
              {dueThisWeek.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <h4 className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                      Due This Week ({dueThisWeek.length})
                    </h4>
                  </div>
                  <div className="space-y-2">{dueThisWeek.map(renderAssignmentCard)}</div>
                </div>
              )}

              {/* Later */}
              {dueLater.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    <h4 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                      Upcoming Deadlines ({dueLater.length})
                    </h4>
                  </div>
                  <div className="space-y-2">{dueLater.map(renderAssignmentCard)}</div>
                </div>
              )}

              {/* Empty state when NO active assignments */}
              {filtered.length === 0 && (
                <div className="py-10 px-4 text-center bg-[#0B0F17]/50 rounded-xl border border-dashed border-[#232B3E]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">No Assignments or Deadlines Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Add your coursework, problem sets, lab reports, and exam deadlines to keep track of your schedule.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#0B0F17] transition-all shadow-md active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Add Your First Assignment</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Completed / Archived List */
            <div>
              {filtered.length > 0 ? (
                <div className="space-y-2">{filtered.map(renderAssignmentCard)}</div>
              ) : (
                <div className="py-10 text-center text-slate-500 bg-[#0B0F17]/40 rounded-xl border border-dashed border-[#232B3E]">
                  <Archive className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-medium text-slate-400">No archived assignments yet</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Completed items will be archived here for reference.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
