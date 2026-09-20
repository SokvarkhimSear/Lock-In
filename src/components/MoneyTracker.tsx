import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  ShoppingBag,
  Fuel,
  Coffee,
  LineChart,
  BookOpen,
  Dumbbell,
  Sparkles,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  Archive,
  Layers,
  Search,
  Filter,
  AlertTriangle,
  History,
  Check,
  X,
  PlusCircle,
  CreditCard,
  Percent
} from 'lucide-react';
import {
  Transaction,
  RecurringExpense,
  WeeklyFinancialBudget,
  ExpenseCategory,
  TransactionType,
  ArchivedWeekSummary
} from '../types';
import {
  formatLocalDateStr,
  getICTTimeParts,
  getWeekIdentifier,
  getWeekStartEndDates,
  isSundayNightICT,
  USER_TIMEZONE
} from '../utils/timeEngine';
import { triggerHapticFeedback } from '../lib/telegram';

interface MoneyTrackerProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  budgetSettings: WeeklyFinancialBudget;
  onUpdateBudgetSettings: (settings: WeeklyFinancialBudget) => void;
  recurringExpenses: RecurringExpense[];
  onUpdateRecurringExpenses: (expenses: RecurringExpense[]) => void;
  currentDate: Date;
}

export const CATEGORY_INFO: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }
> = {
  grocery_food: {
    label: 'Grocery / Eggs / Food',
    icon: ShoppingBag,
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/30',
  },
  transport_fuel: {
    label: 'Transport / Fuel',
    icon: Fuel,
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-500/30',
  },
  trading_capital: {
    label: 'Trading Capital & Fees',
    icon: LineChart,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/30',
  },
  coffee_misc: {
    label: 'Coffee / Miscellaneous',
    icon: Coffee,
    color: 'text-orange-400',
    bg: 'bg-orange-950/40',
    border: 'border-orange-500/30',
  },
  academic_tech: {
    label: 'Academic / Tech / Tools',
    icon: BookOpen,
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-500/30',
  },
  personal_fitness: {
    label: 'Personal / Fitness',
    icon: Dumbbell,
    color: 'text-rose-400',
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/30',
  },
  other: {
    label: 'Other / Custom',
    icon: Sparkles,
    color: 'text-slate-400',
    bg: 'bg-slate-800/40',
    border: 'border-slate-600/30',
  },
};

export const MoneyTracker: React.FC<MoneyTrackerProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  budgetSettings,
  onUpdateBudgetSettings,
  recurringExpenses,
  onUpdateRecurringExpenses,
  currentDate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'recurring' | 'history'>('overview');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState(budgetSettings.weeklyBudgetLimit.toString());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Quick add form state
  const ictNow = getICTTimeParts(currentDate);
  const currentWeekId = getWeekIdentifier(currentDate);
  const weekRange = getWeekStartEndDates(currentDate);

  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<string>('grocery_food');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(formatLocalDateStr(currentDate));

  // Recurring item creation state
  const [isAddingRecurring, setIsAddingRecurring] = useState(false);
  const [newRecTitle, setNewRecTitle] = useState('');
  const [newRecAmount, setNewRecAmount] = useState('');
  const [newRecCategory, setNewRecCategory] = useState<string>('grocery_food');
  const [newRecNotes, setNewRecNotes] = useState('');

  // Confirmation modal for manual reset/archive
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Filter transactions for this week
  const thisWeekTransactions = useMemo(() => {
    return transactions.filter((t) => t.weekId === currentWeekId || t.date >= weekRange.startDateStr && t.date <= weekRange.endDateStr);
  }, [transactions, currentWeekId, weekRange]);

  // Spending calculations
  const totalWeeklySpent = useMemo(() => {
    return thisWeekTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [thisWeekTransactions]);

  const totalWeeklyIncome = useMemo(() => {
    return thisWeekTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [thisWeekTransactions]);

  const remainingBalance = useMemo(() => {
    return (budgetSettings.weeklyBudgetLimit + totalWeeklyIncome) - totalWeeklySpent;
  }, [budgetSettings.weeklyBudgetLimit, totalWeeklyIncome, totalWeeklySpent]);

  const spentPercentage = useMemo(() => {
    const totalCap = budgetSettings.weeklyBudgetLimit + totalWeeklyIncome;
    if (totalCap <= 0) return 0;
    return Math.min(100, Math.round((totalWeeklySpent / totalCap) * 100));
  }, [budgetSettings.weeklyBudgetLimit, totalWeeklyIncome, totalWeeklySpent]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    thisWeekTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [thisWeekTransactions]);

  // Filtered transactions for list view
  const filteredTransactions = useMemo(() => {
    return thisWeekTransactions.filter((t) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        t.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [thisWeekTransactions, searchQuery, selectedCategoryFilter]);

  // Handle Quick Add Submit
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    triggerHapticFeedback('medium');
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: formType,
      amount: Math.round(amountNum * 100) / 100,
      category: formCategory,
      notes: formNotes.trim() || (formType === 'income' ? 'Income Deposit' : 'General Expense'),
      date: formDate || formatLocalDateStr(currentDate),
      time: ictNow.timeStr,
      weekId: currentWeekId,
      createdAt: new Date().toISOString(),
    };

    onAddTransaction(newTx);
    setFormAmount('');
    setFormNotes('');
    setIsQuickAddOpen(false);
  };

  // Apply all enabled recurring expenses to current week
  const handleApplyAllRecurring = () => {
    triggerHapticFeedback('heavy');
    const enabled = recurringExpenses.filter((r) => r.isEnabled);
    if (enabled.length === 0) return;

    const todayStr = formatLocalDateStr(currentDate);
    const existingTitles = new Set(
      thisWeekTransactions.filter((t) => t.isRecurring).map((t) => t.notes)
    );

    let addedCount = 0;
    enabled.forEach((r) => {
      // Check if already logged this week with same note
      if (!existingTitles.has(r.title)) {
        const tx: Transaction = {
          id: `tx-rec-${Date.now()}-${r.id}`,
          type: 'expense',
          amount: r.amount,
          category: r.category,
          notes: r.title,
          date: todayStr,
          time: ictNow.timeStr,
          weekId: currentWeekId,
          createdAt: new Date().toISOString(),
          isRecurring: true,
        };
        onAddTransaction(tx);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      alert(`Applied ${addedCount} fixed recurring expenses to Week ${currentWeekId}!`);
    } else {
      alert('All enabled recurring expenses have already been logged for this week.');
    }
  };

  // Handle Budget Limit Save
  const handleSaveBudgetLimit = () => {
    const val = parseFloat(newBudgetInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateBudgetSettings({
        ...budgetSettings,
        weeklyBudgetLimit: Math.round(val * 100) / 100,
      });
      setIsEditingBudget(false);
      triggerHapticFeedback('light');
    }
  };

  // Manual Reset / Archive Week
  const handleArchiveAndReset = () => {
    triggerHapticFeedback('heavy');
    const summary: ArchivedWeekSummary = {
      weekId: currentWeekId,
      startDate: weekRange.startDateStr,
      endDate: weekRange.endDateStr,
      totalSpent: totalWeeklySpent,
      totalIncome: totalWeeklyIncome,
      budgetLimit: budgetSettings.weeklyBudgetLimit,
      archivedAt: new Date().toISOString(),
      transactionCount: thisWeekTransactions.length,
    };

    const updatedArchived = [summary, ...(budgetSettings.archivedWeeks || [])];
    onUpdateBudgetSettings({
      ...budgetSettings,
      archivedWeeks: updatedArchived,
    });

    setShowArchiveConfirm(false);
    alert(`Week ${currentWeekId} archived successfully! Spending snapshot saved to History.`);
  };

  // Add custom recurring expense
  const handleAddCustomRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newRecAmount);
    if (!newRecTitle.trim() || isNaN(amount) || amount <= 0) return;

    const newItem: RecurringExpense = {
      id: `rec-${Date.now()}`,
      title: newRecTitle.trim(),
      amount: Math.round(amount * 100) / 100,
      category: newRecCategory,
      notes: newRecNotes.trim(),
      isEnabled: true,
    };

    onUpdateRecurringExpenses([...recurringExpenses, newItem]);
    setNewRecTitle('');
    setNewRecAmount('');
    setNewRecNotes('');
    setIsAddingRecurring(false);
  };

  // Toggle recurring item
  const handleToggleRecurring = (id: string) => {
    const updated = recurringExpenses.map((r) =>
      r.id === id ? { ...r, isEnabled: !r.isEnabled } : r
    );
    onUpdateRecurringExpenses(updated);
  };

  // Delete recurring item
  const handleDeleteRecurring = (id: string) => {
    onUpdateRecurringExpenses(recurringExpenses.filter((r) => r.id !== id));
  };

  const isSundayNight = isSundayNightICT(currentDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Real-Time Title & Week Range */}
      <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 tracking-tight">
                  Weekly Money & Expense Tracker
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {currentWeekId}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>ICT (UTC+7)</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {weekRange.formattedRange} • Cloud Firestore Synchronized
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Sunday Alert */}
        <div className="flex flex-wrap items-center gap-2">
          {isSundayNight && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Sunday Night Reset Window</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowArchiveConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#0B0F17] hover:bg-[#232B3E] text-slate-300 border border-[#232B3E] transition-colors"
            title="Snapshot this week and start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset & Archive</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#0B0F17] transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Quick Add</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-[#232B3E] pb-3">
        <div className="flex items-center gap-2 bg-[#0B0F17] p-1 rounded-xl border border-[#232B3E]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#232B3E] text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Weekly Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recurring')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'recurring'
                ? 'bg-[#232B3E] text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fixed Weekly Expenses ({recurringExpenses.filter((r) => r.isEnabled).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-[#232B3E] text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Archived History ({budgetSettings.archivedWeeks?.length || 0})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Firestore: `transactions` live</span>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & WEEKLY BUDGET DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Weekly Budget Limit */}
            <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4.5 shadow-sm relative group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium">Weekly Budget Cap</span>
                <CreditCard className="w-4 h-4 text-slate-500" />
              </div>

              {isEditingBudget ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-400 font-mono text-sm">$</span>
                  <input
                    type="number"
                    step="5"
                    value={newBudgetInput}
                    onChange={(e) => setNewBudgetInput(e.target.value)}
                    className="w-24 bg-[#0B0F17] border border-[#232B3E] rounded px-2 py-1 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveBudgetLimit}
                    className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingBudget(false)}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono text-slate-100">
                    ${budgetSettings.weeklyBudgetLimit.toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBudgetInput(budgetSettings.weeklyBudgetLimit.toString());
                      setIsEditingBudget(true);
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                  >
                    Edit Cap
                  </button>
                </div>
              )}
              <div className="text-[11px] text-slate-500 mt-1.5 font-mono">
                Target weekly discipline cap
              </div>
            </div>

            {/* KPI 2: Total Spent This Week */}
            <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium">Total Spent</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400">
                ${totalWeeklySpent.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                <span className="font-mono font-medium text-slate-300">{thisWeekTransactions.filter((t) => t.type === 'expense').length}</span>
                <span>expenses logged</span>
              </div>
            </div>

            {/* KPI 3: Total Income This Week */}
            <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium">Weekly Income</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                +${totalWeeklyIncome.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                <span className="font-mono font-medium text-slate-300">{thisWeekTransactions.filter((t) => t.type === 'income').length}</span>
                <span>inflows / tutoring / trading</span>
              </div>
            </div>

            {/* KPI 4: Remaining Balance */}
            <div className={`border rounded-xl p-4.5 shadow-sm ${
              remainingBalance >= 0
                ? 'bg-[#161B26] border-[#232B3E]'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium">Remaining Balance</span>
                <Percent className="w-4 h-4 text-slate-500" />
              </div>
              <div className={`text-2xl font-bold font-mono ${
                remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                ${remainingBalance.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                {remainingBalance >= 0 ? (
                  <span className="text-emerald-400 font-medium">Under budget ({100 - spentPercentage}% free)</span>
                ) : (
                  <span className="text-rose-400 font-medium">Over budget by ${Math.abs(remainingBalance).toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Budget Utilization Progress Bar */}
          <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-300">
                <span>Budget Consumption</span>
                <span className="font-mono text-slate-400">
                  ${totalWeeklySpent.toFixed(2)} / ${(budgetSettings.weeklyBudgetLimit + totalWeeklyIncome).toFixed(2)}
                </span>
              </div>
              <span className={`font-mono font-bold ${
                spentPercentage > 90 ? 'text-rose-400' : spentPercentage > 75 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {spentPercentage}%
              </span>
            </div>

            <div className="w-full h-3 bg-[#0B0F17] rounded-full overflow-hidden p-0.5 border border-[#232B3E]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  spentPercentage > 90
                    ? 'bg-gradient-to-r from-rose-500 to-red-600'
                    : spentPercentage > 75
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, spentPercentage)}%` }}
              ></div>
            </div>

            {/* Category Breakdown Chips */}
            {categoryBreakdown.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Top Spending:</span>
                {categoryBreakdown.map(([cat, amt]) => {
                  const info = CATEGORY_INFO[cat] || CATEGORY_INFO.other;
                  const Icon = info.icon;
                  const pct = Math.round((amt / (totalWeeklySpent || 1)) * 100);
                  return (
                    <div
                      key={cat}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${info.border} ${info.bg} ${info.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{info.label.split('/')[0].trim()}:</span>
                      <span className="font-bold">${amt.toFixed(2)}</span>
                      <span className="text-[10px] opacity-75">({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transaction Management Section */}
          <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
            {/* Feed Header with Search & Category Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#232B3E]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Weekly Transactions Log ({filteredTransactions.length})
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Week {currentWeekId}
                </span>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search notes or items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#0B0F17] border border-[#232B3E] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
                  />
                </div>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-[#0B0F17] border border-[#232B3E] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="grocery_food">Grocery / Eggs / Food</option>
                  <option value="transport_fuel">Transport / Fuel</option>
                  <option value="trading_capital">Trading Capital / Fees</option>
                  <option value="coffee_misc">Coffee / Misc</option>
                  <option value="academic_tech">Academic / Tech</option>
                  <option value="personal_fitness">Personal / Fitness</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-full bg-[#0B0F17] border border-[#232B3E] flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-slate-500" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300 mb-1">No Transactions This Week</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Log your daily purchases (groceries, eggs, fuel, trading capital, coffee) to maintain strict financial awareness.
                </p>
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#0B0F17] transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Log First Expense</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#232B3E]/60">
                {filteredTransactions.map((tx) => {
                  const info = CATEGORY_INFO[tx.category] || CATEGORY_INFO.other;
                  const Icon = info.icon;
                  const isExpense = tx.type === 'expense';

                  return (
                    <div
                      key={tx.id}
                      className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#0B0F17]/40 rounded-lg transition-colors group"
                    >
                      {/* Left: Category Icon & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${info.border} ${info.bg} ${info.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-200 truncate">
                              {tx.notes || info.label}
                            </span>
                            {tx.isRecurring && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                                Fixed Weekly
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span>{info.label}</span>
                            <span>•</span>
                            <span>{tx.date}</span>
                            {tx.time && (
                              <>
                                <span>•</span>
                                <span>{tx.time} (ICT)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Delete Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <span className={`text-base font-bold ${
                            isExpense ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {isExpense ? '-' : '+'}${Number(tx.amount).toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHapticFeedback('light');
                            onDeleteTransaction(tx.id);
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors opacity-80 group-hover:opacity-100"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECURRING WEEKLY SPENDING LIST */}
      {activeTab === 'recurring' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">
                Fixed Recurring Weekly Expenses
              </h3>
              <p className="text-xs text-slate-400">
                Pre-set routine costs (Groceries/Eggs, Scooter Fuel, Trading Capital, Coffee). One-click inject into the current week.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyAllRecurring}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-[#0B0F17] transition-all shadow-md active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Apply Enabled to Current Week</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddingRecurring(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#0B0F17] hover:bg-[#232B3E] text-slate-200 border border-[#232B3E] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Custom</span>
              </button>
            </div>
          </div>

          {/* Add Custom Recurring Modal / Panel */}
          {isAddingRecurring && (
            <form
              onSubmit={handleAddCustomRecurring}
              className="bg-[#161B26] border border-cyan-500/40 rounded-xl p-4 sm:p-5 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#232B3E] pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  Add Fixed Recurring Expense
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingRecurring(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Item Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Protein Powder / Gym Membership"
                    value={newRecTitle}
                    onChange={(e) => setNewRecTitle(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Weekly Amount ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="25.00"
                    value={newRecAmount}
                    onChange={(e) => setNewRecAmount(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={newRecCategory}
                    onChange={(e) => setNewRecCategory(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="grocery_food">Grocery / Eggs / Food</option>
                    <option value="transport_fuel">Transport / Fuel</option>
                    <option value="trading_capital">Trading Capital & Fees</option>
                    <option value="coffee_misc">Coffee / Misc</option>
                    <option value="academic_tech">Academic / Tech</option>
                    <option value="personal_fitness">Personal / Fitness</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Notes / Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Notes on schedule or frequency"
                  value={newRecNotes}
                  onChange={(e) => setNewRecNotes(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRecurring(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-[#0B0F17] transition-all"
                >
                  Save Recurring Item
                </button>
              </div>
            </form>
          )}

          {/* Recurring Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recurringExpenses.map((item) => {
              const info = CATEGORY_INFO[item.category] || CATEGORY_INFO.other;
              const Icon = info.icon;
              const isLoggedThisWeek = thisWeekTransactions.some(
                (t) => t.isRecurring && t.notes === item.title
              );

              return (
                <div
                  key={item.id}
                  className={`border rounded-xl p-4.5 transition-all shadow-sm flex flex-col justify-between ${
                    item.isEnabled
                      ? 'bg-[#161B26] border-[#232B3E]'
                      : 'bg-[#161B26]/40 border-[#232B3E]/40 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${info.border} ${info.bg} ${info.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-200">{item.title}</h4>
                          <span className="text-xs text-slate-400 font-mono">{info.label}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-lg font-bold text-slate-100">
                          ${Number(item.amount).toFixed(2)}
                        </span>
                        <div className="text-[10px] text-slate-500 uppercase">Per Week</div>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-400 mb-3 bg-[#0B0F17] p-2 rounded-lg border border-[#232B3E]/60">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#232B3E]/60 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleRecurring(item.id)}
                        className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-medium border transition-colors ${
                          item.isEnabled
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.isEnabled ? 'Enabled' : 'Disabled'}
                      </button>

                      {isLoggedThisWeek ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Logged in {currentWeekId}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Pending log
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRecurring(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Delete Recurring"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ARCHIVED WEEKS HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4.5 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Archived Weekly Snapshots</h3>
              <p className="text-xs text-slate-400">
                Historical records archived on Sunday resets to track discipline over time.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {budgetSettings.archivedWeeks?.length || 0} Archived Weeks
            </div>
          </div>

          {(!budgetSettings.archivedWeeks || budgetSettings.archivedWeeks.length === 0) ? (
            <div className="text-center py-12 bg-[#161B26] border border-[#232B3E] rounded-xl p-6">
              <Archive className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No archived weeks yet. Archive on Sunday night or click "Reset & Archive" above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetSettings.archivedWeeks.map((arch) => {
                const diff = (arch.budgetLimit + arch.totalIncome) - arch.totalSpent;
                const isUnder = diff >= 0;

                return (
                  <div
                    key={arch.weekId + arch.archivedAt}
                    className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm text-slate-100">{arch.weekId}</span>
                        <span className="text-xs text-slate-400">({arch.startDate} – {arch.endDate})</span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{arch.transactionCount} transactions</span>
                        <span>•</span>
                        <span>Archived: {new Date(arch.archivedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">SPENT</span>
                        <span className="font-bold text-rose-400">${arch.totalSpent.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">CAP</span>
                        <span className="text-slate-300">${arch.budgetLimit.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px]">OUTCOME</span>
                        <span className={`font-bold ${isUnder ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUnder ? `+$${diff.toFixed(2)} free` : `-$${Math.abs(diff).toFixed(2)} over`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUICK ADD TRANSACTION MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161B26] border border-[#232B3E] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#232B3E] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Log Transaction</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              {/* Type Switcher: Expense vs Income */}
              <div className="grid grid-cols-2 gap-2 bg-[#0B0F17] p-1 rounded-xl border border-[#232B3E]">
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    formType === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    formType === 'income'
                      ? 'bg-emerald-500 text-[#0B0F17] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Income</span>
                </button>
              </div>

              {/* Amount Input & Quick Chips */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-xl pl-8 pr-3 py-2.5 text-lg font-mono text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[2, 5, 10, 20, 35, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormAmount(amt.toString())}
                      className="px-2 py-1 rounded bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] text-[11px] font-mono text-slate-300"
                    >
                      +${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                    const Icon = info.icon;
                    const isSelected = formCategory === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormCategory(key)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left border transition-all text-xs ${
                          isSelected
                            ? `${info.bg} ${info.border} ${info.color} font-semibold ring-1 ring-emerald-400/30`
                            : 'bg-[#0B0F17] border-[#232B3E] text-slate-300 hover:bg-[#232B3E]/50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">
                  Description / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eggs & groceries at Lucky Supermarket"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Date Input (Strict ICT) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">
                    Date (ICT)
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">
                    Week Target
                  </label>
                  <div className="bg-[#0B0F17] border border-[#232B3E] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono">
                    {currentWeekId}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232B3E]">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#0B0F17] transition-all shadow-md active:scale-95"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE & RESET MODAL */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161B26] border border-[#232B3E] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Reset & Archive Week?</h3>
                <p className="text-xs text-slate-400">Week {currentWeekId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              This will save a complete summary of your weekly spending (${totalWeeklySpent.toFixed(2)}) to the Archived History archive, preparing a fresh balance for the new week.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveAndReset}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-[#0B0F17] transition-all shadow-md"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
