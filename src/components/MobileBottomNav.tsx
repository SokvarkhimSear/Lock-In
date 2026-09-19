import React from 'react';
import { LayoutDashboard, Clock, CalendarDays, Plus, Play } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'timetable' | 'assignments';
  onTabChange: (tab: 'dashboard' | 'timetable' | 'assignments') => void;
  onOpenAddModal: () => void;
  onOpenFocusSprint: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  onOpenFocusSprint,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#0B0F17]/95 backdrop-blur-xl border-t border-[#232B3E] px-2 py-1.5 shadow-2xl safe-area-bottom"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Dashboard Tab */}
        <button
          type="button"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1 rounded-lg ${
              activeTab === 'dashboard' ? 'bg-emerald-500/15' : ''
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Today</span>
        </button>

        {/* Timetable Tab */}
        <button
          type="button"
          onClick={() => onTabChange('timetable')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition-all ${
            activeTab === 'timetable'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1 rounded-lg ${
              activeTab === 'timetable' ? 'bg-cyan-500/15' : ''
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Schedule</span>
        </button>

        {/* Central Prominent "+ Add Assignment" Button */}
        <div className="flex items-center justify-center px-1">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#0B0F17] flex items-center justify-center shadow-lg shadow-emerald-950/50 active:scale-95 transition-all -translate-y-1.5"
            title="Add New Assignment"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Calendar / Deadlines Tab */}
        <button
          type="button"
          onClick={() => onTabChange('assignments')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition-all ${
            activeTab === 'assignments'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1 rounded-lg ${
              activeTab === 'assignments' ? 'bg-amber-500/15' : ''
            }`}
          >
            <CalendarDays className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Deadlines</span>
        </button>

        {/* Focus Sprint Trigger */}
        <button
          type="button"
          onClick={onOpenFocusSprint}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl text-slate-400 hover:text-emerald-300 transition-all active:scale-95"
          title="Open Focus Sprint Timer"
        >
          <div className="p-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium text-emerald-400">Sprint</span>
        </button>
      </div>
    </nav>
  );
};
