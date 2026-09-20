import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Assignment, DayOfWeek, ScheduleBlock, Transaction, WeeklyFinancialBudget, RecurringExpense } from './types';
import {
  addStoredBlockLog,
  getStoredAssignments,
  getTodayBlockCompletionCount,
  saveStoredAssignments,
  syncDeleteAssignment,
  syncSaveAssignment,
  getStoredTransactions,
  saveStoredTransactions,
  syncSaveTransactionWithCache,
  syncDeleteTransactionWithCache,
  getStoredFinancialBudget,
  saveStoredFinancialBudget,
  getStoredRecurringExpenses,
  saveStoredRecurringExpenses,
} from './utils/storage';
import {
  subscribeToAssignments,
  subscribeToBlockLogs,
  subscribeToTransactions,
  subscribeToFinancialSettings,
  subscribeToRecurringExpenses,
  syncSaveFinancialSettings,
  syncSaveRecurringExpense,
} from './lib/firebase';
import {
  initTelegramWebApp,
  triggerHapticFeedback,
  sendAssignmentTelegramReminder,
  sendScheduleShiftTelegramReminder,
  sendOneHourPreDeadlineAlert,
  sendWorkoutTelegramPing,
} from './lib/telegram';
import {
  calculateFlowStatus,
  CurrentFlowStatus,
  getCurrentDayBlocks,
  getMinutesUntilDue,
  soundEngine,
  getICTTimeParts,
  getWeekIdentifier,
} from './utils/timeEngine';
import { Header } from './components/Header';
import { TodayFlow } from './components/TodayFlow';
import { FocusSprintModal } from './components/FocusSprintModal';
import { DeadlineCalendar } from './components/DeadlineCalendar';
import { AssignmentList } from './components/AssignmentList';
import { AssignmentModal } from './components/AssignmentModal';
import { ScratchpadWidget } from './components/ScratchpadWidget';
import { MasterTimetable } from './components/MasterTimetable';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MoneyTracker } from './components/MoneyTracker';
import { Plus, Calendar, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timetable' | 'assignments' | 'money'>('dashboard');

  // Real-time clock state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Simulation mode overrides (for testing the engine at any day/hour)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedDay, setSimulatedDay] = useState<DayOfWeek | null>(null);
  const [simulatedMinutes, setSimulatedMinutes] = useState<number | null>(null);

  // Focus sprint modal state
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [sprintTaskTitle, setSprintTaskTitle] = useState('Deep Work Focus Block');

  // Assignment Modal state
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | undefined>(undefined);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Persistent assignments & completed logs
  const [assignments, setAssignments] = useState<Assignment[]>(() => getStoredAssignments());
  const [completedCount, setCompletedCount] = useState<number>(() => getTodayBlockCompletionCount());
  const [completedBlockIds, setCompletedBlockIds] = useState<Set<string>>(new Set());

  // ==========================================================================
  // MONEY TRACKER STATE & FIRESTORE REAL-TIME SYNCHRONIZATION
  // ==========================================================================
  const currentWeekId = useMemo(() => getWeekIdentifier(currentDate), [currentDate]);
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [budgetSettings, setBudgetSettings] = useState<WeeklyFinancialBudget>(() =>
    getStoredFinancialBudget(currentWeekId)
  );
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() =>
    getStoredRecurringExpenses()
  );

  // Real-time Firestore listener for Transactions collection
  useEffect(() => {
    const unsubscribe = subscribeToTransactions((firestoreTx) => {
      if (firestoreTx) {
        setTransactions(firestoreTx);
        saveStoredTransactions(firestoreTx);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener for Weekly Financial Settings
  useEffect(() => {
    const unsubscribe = subscribeToFinancialSettings((remoteSettings) => {
      if (remoteSettings) {
        setBudgetSettings(remoteSettings);
        saveStoredFinancialBudget(remoteSettings);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener for Recurring Expenses
  useEffect(() => {
    const unsubscribe = subscribeToRecurringExpenses((remoteRecurring) => {
      if (remoteRecurring && remoteRecurring.length > 0) {
        setRecurringExpenses(remoteRecurring);
        saveStoredRecurringExpenses(remoteRecurring);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddTransaction = async (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev.filter((t) => t.id !== newTx.id)]);
    await syncSaveTransactionWithCache(newTx);
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await syncDeleteTransactionWithCache(id);
  };

  const handleUpdateBudgetSettings = async (settings: WeeklyFinancialBudget) => {
    setBudgetSettings(settings);
    saveStoredFinancialBudget(settings);
    await syncSaveFinancialSettings(settings);
  };

  const handleUpdateRecurringExpenses = async (expenses: RecurringExpense[]) => {
    setRecurringExpenses(expenses);
    saveStoredRecurringExpenses(expenses);
    for (const exp of expenses) {
      await syncSaveRecurringExpense(exp);
    }
  };

  // ==========================================================================
  // 6:55 AM MORNING ROUTINE WORKOUT TELEGRAM PING (Mon – Fri, ICT UTC+7)
  // Format: "🏋️ WORKOUT TIME - Lock in for your 40-min session!"
  // ==========================================================================
  const lastWorkoutPingDateRef = useRef<string>(
    localStorage.getItem('lockin_last_workout_ping') || ''
  );

  useEffect(() => {
    const checkWorkoutPing = async () => {
      const { dayOfWeek, hours, minutes, dateStr } = getICTTimeParts(new Date());

      // Monday through Friday (1 to 5)
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isWorkoutTime = hours === 6 && minutes === 55;

      if (isWeekday && isWorkoutTime && lastWorkoutPingDateRef.current !== dateStr) {
        lastWorkoutPingDateRef.current = dateStr;
        try {
          localStorage.setItem('lockin_last_workout_ping', dateStr);
        } catch {}
        await sendWorkoutTelegramPing();
      }
    };

    checkWorkoutPing();
    const interval = setInterval(checkWorkoutPing, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Telegram Mini App WebApp SDK on application load
  useEffect(() => {
    initTelegramWebApp();
  }, []);

  // Real-time clock interval (ticks every 1s)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time bidirectional Firestore sync for assignments
  useEffect(() => {
    const unsubscribe = subscribeToAssignments((remoteAssignments) => {
      if (remoteAssignments && remoteAssignments.length > 0) {
        setAssignments(remoteAssignments);
        saveStoredAssignments(remoteAssignments);
      } else {
        // If Firestore collection has no documents yet, push existing local assignments to cloud
        const local = getStoredAssignments();
        if (local.length > 0) {
          local.forEach((a) => syncSaveAssignment(a));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time sync for block completion logs
  useEffect(() => {
    const unsubscribe = subscribeToBlockLogs((logs) => {
      if (logs && logs.length > 0) {
        const todayPrefix = new Date().toISOString().split('T')[0];
        const count = logs.filter(
          (l) => l.timestamp.startsWith(todayPrefix) && l.status === 'completed'
        ).length;
        setCompletedCount(count);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync assignments to state, localStorage & Firestore
  const updateAssignmentsState = (updated: Assignment[]) => {
    setAssignments(updated);
    saveStoredAssignments(updated);
  };

  // Keep latest assignments ref for background interval scanning
  const assignmentsRef = useRef<Assignment[]>(assignments);
  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);

  // Set to track assignments alerted in the current session to prevent duplicate notifications
  const alertedIdsRef = useRef<Set<string>>(new Set());

  // 1-Hour Pre-Deadline Notification Background Checker:
  // Scans all active Firebase assignments every 60 seconds using local ICT (UTC+7) time.
  useEffect(() => {
    const checkUpcomingDeadlines = async () => {
      const now = new Date();
      const currentList = assignmentsRef.current;

      for (const assignment of currentList) {
        // Skip completed or already alerted assignments
        if (assignment.isCompleted || assignment.alertSent || alertedIdsRef.current.has(assignment.id)) {
          continue;
        }

        const minutesLeft = getMinutesUntilDue(assignment.dueDate, assignment.dueTime, now);
        if (minutesLeft === null) continue;

        // If deadline is between 59 and 60 minutes away
        if (minutesLeft >= 59 && minutesLeft <= 60) {
          alertedIdsRef.current.add(assignment.id);

          // Dispatch Telegram notification to ID 2128817856
          await sendOneHourPreDeadlineAlert(assignment.title, assignment.dueTime);

          // Mark alertSent: true on that assignment document in Firebase and local storage
          const updatedAssignment: Assignment = {
            ...assignment,
            alertSent: true,
          };

          syncSaveAssignment(updatedAssignment);
          setAssignments((prev) =>
            prev.map((a) => (a.id === updatedAssignment.id ? updatedAssignment : a))
          );
        }
      }
    };

    // Run initial scan once
    checkUpcomingDeadlines();

    // Run every 60 seconds
    const interval = setInterval(checkUpcomingDeadlines, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute active timetable engine flow status
  const flowStatus: CurrentFlowStatus = useMemo(() => {
    return calculateFlowStatus(
      currentDate,
      isSimulating && simulatedDay !== null ? simulatedDay : undefined,
      isSimulating && simulatedMinutes !== null ? simulatedMinutes : undefined
    );
  }, [currentDate, isSimulating, simulatedDay, simulatedMinutes]);

  const activeDayIndex = isSimulating && simulatedDay !== null ? simulatedDay : (currentDate.getDay() as DayOfWeek);
  const todayBlocks = useMemo(() => getCurrentDayBlocks(activeDayIndex), [activeDayIndex]);

  // Track schedule block shifts and dispatch Telegram reminders to user
  const prevBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (flowStatus.currentBlock && flowStatus.currentBlock.id !== prevBlockIdRef.current) {
      if (prevBlockIdRef.current !== null) {
        sendScheduleShiftTelegramReminder(
          flowStatus.currentBlock.title,
          flowStatus.currentBlock.startTime,
          flowStatus.currentBlock.endTime,
          flowStatus.currentBlock.category
        );
      }
      prevBlockIdRef.current = flowStatus.currentBlock.id;
    }
  }, [flowStatus.currentBlock]);

  // Handler for marking block completed
  const handleMarkBlockCompleted = (block: ScheduleBlock) => {
    setCompletedBlockIds((prev) => new Set([...prev, block.id]));
    addStoredBlockLog({
      blockId: block.id,
      blockName: block.title,
      status: 'completed',
    });
    setCompletedCount(getTodayBlockCompletionCount());
  };

  // Handler for extending block
  const handleExtendBlock = (block: ScheduleBlock, extraMinutes: number) => {
    addStoredBlockLog({
      blockId: block.id,
      blockName: block.title,
      status: 'extended',
      notes: `Extended by ${extraMinutes} mins`,
    });
    // Temporary simulation extension or notice
    soundEngine.playClick();
  };

  // Handler for launching focus sprint
  const handleOpenFocusSprint = (blockTitle?: string) => {
    setSprintTaskTitle(blockTitle || (flowStatus.currentBlock ? flowStatus.currentBlock.title : 'Deep Focus Sprint'));
    setIsFocusModalOpen(true);
  };

  const handleSprintCompleted = (title: string, durationMinutes: number) => {
    addStoredBlockLog({
      blockName: `Focus Sprint: ${title}`,
      status: 'completed',
      notes: `${durationMinutes}m focus session`,
    });
    setCompletedCount(getTodayBlockCompletionCount());
    if (flowStatus.currentBlock) {
      setCompletedBlockIds((prev) => new Set([...prev, flowStatus.currentBlock!.id]));
    }
  };

  // Assignment handlers
  const handleSaveAssignment = (data: Omit<Assignment, 'id' | 'createdAt' | 'isCompleted'>) => {
    if (editingAssignment) {
      const updatedItem: Assignment = { ...editingAssignment, ...data };
      const updated = assignments.map((a) =>
        a.id === editingAssignment.id ? updatedItem : a
      );
      updateAssignmentsState(updated);
      syncSaveAssignment(updatedItem);
      triggerHapticFeedback('light');
      setEditingAssignment(null);
    } else {
      const newAsg: Assignment = {
        ...data,
        id: `asg-${Date.now()}`,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      updateAssignmentsState([newAsg, ...assignments]);
      syncSaveAssignment(newAsg);
      triggerHapticFeedback('medium');
      sendAssignmentTelegramReminder('added', newAsg.title, newAsg.courseCode, newAsg.dueDate, newAsg.dueTime);
    }
  };

  const handleToggleAssignment = (id: string) => {
    const target = assignments.find((a) => a.id === id);
    if (!target) return;

    const nextCompleted = !target.isCompleted;
    const updatedItem: Assignment = {
      ...target,
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
    };

    const updated = assignments.map((a) => (a.id === id ? updatedItem : a));
    updateAssignmentsState(updated);
    syncSaveAssignment(updatedItem);
    triggerHapticFeedback('medium');
    if (nextCompleted) {
      sendAssignmentTelegramReminder('completed', updatedItem.title, updatedItem.courseCode, updatedItem.dueDate, updatedItem.dueTime);
    }
  };

  const handleDeleteAssignment = (id: string) => {
    const updated = assignments.filter((a) => a.id !== id);
    updateAssignmentsState(updated);
    syncDeleteAssignment(id);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setIsAssignmentModalOpen(true);
  };

  const handleOpenAddModal = (dateStr?: string) => {
    setEditingAssignment(null);
    setSelectedDateForModal(dateStr);
    setIsAssignmentModalOpen(true);
  };

  // Simulation controls
  const handleApplySimulation = (day: DayOfWeek, minutes: number) => {
    setIsSimulating(true);
    setSimulatedDay(day);
    setSimulatedMinutes(minutes);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimulatedDay(null);
    setSimulatedMinutes(null);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans flex flex-col antialiased">
      {/* Top Sticky Header */}
      <Header
        currentDate={currentDate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenFocusSprint={() => handleOpenFocusSprint()}
        onOpenAddModal={() => handleOpenAddModal()}
        completedTodayCount={completedCount}
        isSimulating={isSimulating}
        simulatedDay={simulatedDay}
        simulatedTimeMinutes={simulatedMinutes}
        onApplySimulation={handleApplySimulation}
        onResetSimulation={handleResetSimulation}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-8 py-4 sm:py-6 pb-28 md:pb-8">
        {/* VIEW 1: DASHBOARD (Today's Flow + Split Grid) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-150">
            {/* MODULE 1: DYNAMIC "TODAY'S FLOW" DASHBOARD */}
            <TodayFlow
              flowStatus={flowStatus}
              todayBlocks={todayBlocks}
              onMarkCompleted={handleMarkBlockCompleted}
              onExtendBlock={handleExtendBlock}
              onStartFocusSprint={handleOpenFocusSprint}
              isBlockCompleted={(id) => completedBlockIds.has(id)}
            />

            {/* Prominent Quick Action Bar on Main Dashboard */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-[#161B26] border border-[#232B3E] rounded-xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <span>Coursework & Homework Tracker</span>
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#0B0F17] text-slate-400 border border-[#232B3E]">
                      {assignments.filter((a) => !a.isCompleted).length} Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add custom courses, exact deadline times, and priorities without visual clutter.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#0B0F17] transition-all shadow-md shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Add Assignment</span>
              </button>
            </div>

            {/* Split Grid: Left = Assignments & Deadlines | Right = Scratchpad Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Calendar & Upcoming Assignments */}
              <div className="lg:col-span-7 space-y-6">
                <AssignmentList
                  assignments={assignments}
                  onToggleComplete={handleToggleAssignment}
                  onDeleteAssignment={handleDeleteAssignment}
                  onEditAssignment={handleEditAssignment}
                  onOpenAddModal={() => handleOpenAddModal()}
                  todayDate={currentDate}
                />

                <DeadlineCalendar
                  assignments={assignments}
                  onSelectDate={(d) => handleOpenAddModal(d)}
                  onOpenAddModal={(d) => handleOpenAddModal(d)}
                  todayDate={currentDate}
                />
              </div>

              {/* Right Column: Scratchpad / Notes Widget */}
              <div className="lg:col-span-5 space-y-6 sticky top-20">
                <ScratchpadWidget />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MASTER TIMETABLE VIEW (FULL WEEKLY GRID) */}
        {activeTab === 'timetable' && (
          <MasterTimetable
            currentDay={activeDayIndex}
            currentMinutes={flowStatus.currentMinutes}
            onSelectBlockForSprint={(title) => handleOpenFocusSprint(title)}
          />
        )}

        {/* VIEW 3: DEDICATED ASSIGNMENTS & CALENDAR VIEW */}
        {activeTab === 'assignments' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <DeadlineCalendar
                  assignments={assignments}
                  onSelectDate={(d) => handleOpenAddModal(d)}
                  onOpenAddModal={(d) => handleOpenAddModal(d)}
                />
              </div>
              <div className="lg:col-span-4">
                <AssignmentList
                  assignments={assignments}
                  onToggleComplete={handleToggleAssignment}
                  onDeleteAssignment={handleDeleteAssignment}
                  onEditAssignment={handleEditAssignment}
                  onOpenAddModal={() => handleOpenAddModal()}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: WEEKLY MONEY & EXPENSE TRACKER */}
        {activeTab === 'money' && (
          <MoneyTracker
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            budgetSettings={budgetSettings}
            onUpdateBudgetSettings={handleUpdateBudgetSettings}
            recurringExpenses={recurringExpenses}
            onUpdateRecurringExpenses={handleUpdateRecurringExpenses}
            currentDate={currentDate}
          />
        )}
      </main>

      {/* Footer (with bottom padding on mobile so content is not obscured by bottom bar) */}
      <footer className="border-t border-[#232B3E] py-4 text-center text-xs text-slate-500 font-mono mb-16 md:mb-0">
        <p>LockIn — Distraction-Free High-Execution System</p>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal()}
        onOpenFocusSprint={() => handleOpenFocusSprint()}
      />

      {/* Focus Sprint Timer Modal / Fullscreen */}
      <FocusSprintModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        initialBlockTitle={sprintTaskTitle}
        onLogCompletedSprint={handleSprintCompleted}
      />

      {/* Add / Edit Assignment Modal */}
      <AssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setEditingAssignment(null);
        }}
        onSave={handleSaveAssignment}
        initialDate={selectedDateForModal}
        editingAssignment={editingAssignment}
      />
    </div>
  );
}
