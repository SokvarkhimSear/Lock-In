import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Sparkles, X, BookOpen, AlertCircle } from 'lucide-react';
import { Assignment, PriorityLevel } from '../types';
import { COURSES } from '../data/scheduleData';
import { formatLocalDateStr } from '../utils/timeEngine';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: Omit<Assignment, 'id' | 'createdAt' | 'isCompleted'>) => void;
  initialDate?: string;
  editingAssignment?: Assignment | null;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  editingAssignment,
}) => {
  const [courseCode, setCourseCode] = useState('COSC 121');
  const [customCourse, setCustomCourse] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<PriorityLevel>('high');

  // Sync state whenever modal is opened or editingAssignment changes
  useEffect(() => {
    if (isOpen) {
      if (editingAssignment) {
        const isPreset = COURSES.some((c) => c.code === editingAssignment.courseCode && c.code !== 'OTHER');
        if (isPreset) {
          setCourseCode(editingAssignment.courseCode);
          setCustomCourse('');
        } else {
          setCourseCode('OTHER');
          setCustomCourse(editingAssignment.courseCode);
        }
        setTitle(editingAssignment.title);
        setDescription(editingAssignment.description || '');
        setDueDate(editingAssignment.dueDate);
        setDueTime(editingAssignment.dueTime || '23:59');
        setPriority(editingAssignment.priority);
      } else {
        setCourseCode('COSC 121');
        setCustomCourse('');
        setTitle('');
        setDescription('');
        setDueDate(initialDate || formatLocalDateStr());
        setDueTime('23:59');
        setPriority('high');
      }
    }
  }, [isOpen, editingAssignment, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCourse =
      courseCode === 'OTHER'
        ? (customCourse.trim() || 'General')
        : courseCode;

    onSave({
      courseCode: finalCourse,
      title: title.trim(),
      description: description.trim(),
      dueDate,
      dueTime: dueTime || '23:59',
      priority,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#161B26] border border-[#232B3E] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#232B3E] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}
              </h3>
              <p className="text-xs text-slate-400">Track deadlines, course deliverables, and priorities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[40px] min-w-[40px] rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#232B3E] transition-colors flex items-center justify-center"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable if needed on small phones) */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto flex-1 pr-1">
          {/* Course Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Course / Subject
            </label>
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full min-h-[44px] bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-base sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {COURSES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code !== 'OTHER' ? `${c.code}: ${c.name}` : 'Other / Custom Course'}
                </option>
              ))}
            </select>

            {courseCode === 'OTHER' && (
              <div className="mt-2 animate-in fade-in duration-100">
                <input
                  type="text"
                  placeholder="Enter custom course name or code (e.g. STAT 200)"
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  className="w-full min-h-[44px] bg-[#0B0F17] border border-cyan-700/60 rounded-lg px-3 py-2 text-base sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                  required
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Assignment Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lab 4 Distributed Consensus, Problem Set 3..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-base sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Notes & Requirements (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Rubric notes, submission portal link, or key milestones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg p-3 text-base sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Due Date & Exact Due Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-h-[44px] bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-base sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Exact Due Time
              </label>
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full min-h-[44px] bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-base sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Priority Level Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`min-h-[44px] px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  priority === 'high'
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold ring-1 ring-rose-500/30'
                    : 'bg-[#0B0F17] border-[#232B3E] text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>High</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`min-h-[44px] px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  priority === 'medium'
                    ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 font-bold ring-1 ring-blue-500/30'
                    : 'bg-[#0B0F17] border-[#232B3E] text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                <span>Medium</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`min-h-[44px] px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  priority === 'low'
                    ? 'bg-slate-600/30 border-slate-500 text-slate-200 font-bold ring-1 ring-slate-500/30'
                    : 'bg-[#0B0F17] border-[#232B3E] text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                <span>Low</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#232B3E] flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#232B3E] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#0B0F17] transition-all shadow-md flex items-center gap-1.5"
            >
              <span>{editingAssignment ? 'Save Changes' : '+ Add Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
