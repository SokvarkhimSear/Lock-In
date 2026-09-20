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
  CreditCard,
  Percent,
  ChevronRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import {
  Transaction,
  RecurringExpense,
  WeeklyFinancialBudget,
  TransactionType,
  WeeklyArchive
} from '../types';
import {
  formatLocalDateStr,
  getICTTimeParts,
  getWeekIdentifier,
  getWeekStartEndDates,
  isSundayNightICT,
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
  weeklyArchives: WeeklyArchive[];
  onSaveWeeklyArchive: (archive: WeeklyArchive) => void;
  onDeleteWeeklyArchive: (weekId: string) => void;
  currentDate: Date;
}

// ============================================================================
// CATEGORY DEFINITIONS FOR EXPENSES & INCOMES
// ============================================================================

export const EXPENSE_CATEGORIES: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }
> = {
  grocery_food: {
    label: 'Groceries / Eggs / Food',
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
  coffee_snacks: {
    label: 'Coffee / Snacks',
    icon: Coffee,
    color: 'text-orange-400',
    bg: 'bg-orange-950/40',
    border: 'border-orange-500/30',
  },
  academic_school: {
    label: 'Academic / School / Books',
    icon: BookOpen,
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-500/30',
  },
  bills_misc: {
    label: 'Bills & Miscellaneous',
    icon: CreditCard,
    color: 'text-purple-400',
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/30',
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

export const INCOME_CATEGORIES: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }
> = {
  tutoring: {
    label: 'Tutoring / Teaching',
    icon: BookOpen,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/30',
  },
  trading_profits: {
    label: 'Trading Profits',
    icon: TrendingUp,
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-500/30',
  },
  freelance: {
    label: 'Freelance / Dev Gigs',
    icon: LineChart,
    color: 'text-teal-400',
    bg: 'bg-teal-950/40',
    border: 'border-teal-500/30',
  },
  salary_work: {
    label: 'Salary / Wages',
    icon: CreditCard,
    color: 'text-blue-400',
    bg: 'bg-blue-950/40',
    border: 'border-blue-500/30',
  },
  allowance_gift: {
    label: 'Allowance / Transfer',
    icon: Wallet,
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/30',
  },
  other_income: {
    label: 'Other Inflow',
    icon: Sparkles,
    color: 'text-slate-400',
    bg: 'bg-slate-800/40',
    border: 'border-slate-600/30',
  },
};

export function getCategoryMeta(type: TransactionType, catKey: string) {
  if (type === 'income') {
    return INCOME_CATEGORIES[catKey] || INCOME_CATEGORIES.other_income;
  }
  return EXPENSE_CATEGORIES[catKey] || EXPENSE_CATEGORIES.other;
}

export const MoneyTracker: React.FC<MoneyTrackerProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  budgetSettings,
  onUpdateBudgetSettings,
  recurringExpenses,
  onUpdateRecurringExpenses,
  weeklyArchives,
  onSaveWeeklyArchive,
  onDeleteWeeklyArchive,
  currentDate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'recurring' | 'history'>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState(budgetSettings.weeklyBudgetLimit.toString());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Time & Week calculations in ICT
  const ictNow = getICTTimeParts(currentDate);
  const currentWeekId = getWeekIdentifier(currentDate);
  const weekRange = getWeekStartEndDates(currentDate);

  // Quick add / Modal form state
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<string>('grocery_food');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(formatLocalDateStr(currentDate));
  const [formTime, setFormTime] = useState(ictNow.timeStr);

  // Selected archived week in History tab
  const [selectedArchiveWeekId, setSelectedArchiveWeekId] = useState<string>(() => {
    if (weeklyArchives.length > 0) return weeklyArchives[0].weekId;
    return '';
  });
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');

  // Recurring item creation state
  const [isAddingRecurring, setIsAddingRecurring] = useState(false);
  const [newRecTitle, setNewRecTitle] = useState('');
  const [newRecAmount, setNewRecAmount] = useState('');
  const [newRecCategory, setNewRecCategory] = useState<string>('grocery_food');
  const [newRecNotes, setNewRecNotes] = useState('');

  // Confirmation modal for manual reset/archive
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // ==========================================================================
  // 1. LIFETIME BALANCE CALCULATIONS (All-Time)
  // ==========================================================================
  const allTimeIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const allTimeExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalAvailableBalance = useMemo(() => {
    return allTimeIncome - allTimeExpenses;
  }, [allTimeIncome, allTimeExpenses]);

  // ==========================================================================
  // 2. CURRENT WEEK TRANSACTIONS & METRICS
  // ==========================================================================
  const thisWeekTransactions = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.weekId === currentWeekId ||
        (t.date >= weekRange.startDateStr && t.date <= weekRange.endDateStr)
    );
  }, [transactions, currentWeekId, weekRange]);

  const thisWeekIncome = useMemo(() => {
    return thisWeekTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [thisWeekTransactions]);

  const thisWeekSpent = useMemo(() => {
    return thisWeekTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [thisWeekTransactions]);

  const remainingWeeklyBudgetCap = useMemo(() => {
    return budgetSettings.weeklyBudgetLimit - thisWeekSpent;
  }, [budgetSettings.weeklyBudgetLimit, thisWeekSpent]);

  const budgetCapUtilizationPct = useMemo(() => {
    if (budgetSettings.weeklyBudgetLimit <= 0) return 0;
    return Math.min(150, Math.round((thisWeekSpent / budgetSettings.weeklyBudgetLimit) * 100));
  }, [budgetSettings.weeklyBudgetLimit, thisWeekSpent]);

  // Top spending categories breakdown for this week
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    thisWeekTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [thisWeekTransactions]);

  // Filtered transactions for feed
  const filteredTransactions = useMemo(() => {
    return thisWeekTransactions.filter((t) => {
      const desc = (t.description || t.notes || '').toLowerCase();
      const matchSearch =
        searchQuery.trim() === '' ||
        desc.includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [thisWeekTransactions, searchQuery, selectedCategoryFilter]);

  // Open modal with pre-selected type
  const handleOpenModal = (type: TransactionType) => {
    triggerHapticFeedback('light');
    setFormType(type);
    setFormCategory(type === 'income' ? 'tutoring' : 'grocery_food');
    setFormAmount('');
    setFormDescription('');
    setFormDate(formatLocalDateStr(currentDate));
    setFormTime(getICTTimeParts(new Date()).timeStr);
    setIsModalOpen(true);
  };

  // Submit Transaction
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    triggerHapticFeedback('medium');
    const cleanDesc =
      formDescription.trim() ||
      (formType === 'income' ? 'Income Inflow' : 'General Purchase');

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: formType,
      amount: Math.round(amountNum * 100) / 100,
      category: formCategory,
      description: cleanDesc,
      notes: cleanDesc,
      date: formDate || formatLocalDateStr(currentDate),
      time: formTime || ictNow.timeStr,
      timestamp: new Date().toISOString(),
      weekId: currentWeekId,
      createdAt: new Date().toISOString(),
    };

    onAddTransaction(newTx);
    setFormAmount('');
    setFormDescription('');
    setIsModalOpen(false);
  };

  // Save weekly budget limit
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

  // End Week & Archive Snapshot
  const handleArchiveWeek = () => {
    triggerHapticFeedback('heavy');

    const newArchive: WeeklyArchive = {
      id: currentWeekId,
      weekId: currentWeekId,
      startDate: weekRange.startDateStr,
      endDate: weekRange.endDateStr,
      totalSpent: Math.round(thisWeekSpent * 100) / 100,
      totalIncome: Math.round(thisWeekIncome * 100) / 100,
      netWeeklyFlow: Math.round((thisWeekIncome - thisWeekSpent) * 100) / 100,
      budgetLimit: budgetSettings.weeklyBudgetLimit,
      archivedAt: new Date().toISOString(),
      transactionCount: thisWeekTransactions.length,
      transactions: [...thisWeekTransactions],
    };

    onSaveWeeklyArchive(newArchive);
    setSelectedArchiveWeekId(currentWeekId);
    setShowArchiveConfirm(false);
    setActiveTab('history');
  };

  // Apply recurring expenses
  const handleApplyAllRecurring = () => {
    triggerHapticFeedback('heavy');
    const enabled = recurringExpenses.filter((r) => r.isEnabled);
    if (enabled.length === 0) return;

    const todayStr = formatLocalDateStr(currentDate);
    const existingDescriptions = new Set(
      thisWeekTransactions.filter((t) => t.isRecurring).map((t) => t.description || t.notes)
    );

    let addedCount = 0;
    enabled.forEach((r) => {
      if (!existingDescriptions.has(r.title)) {
        const tx: Transaction = {
          id: `tx-rec-${Date.now()}-${r.id}`,
          type: 'expense',
          amount: r.amount,
          category: r.category,
          description: r.title,
          notes: r.title,
          date: todayStr,
          time: ictNow.timeStr,
          timestamp: new Date().toISOString(),
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

  const handleToggleRecurring = (id: string) => {
    const updated = recurringExpenses.map((r) =>
      r.id === id ? { ...r, isEnabled: !r.isEnabled } : r
    );
    onUpdateRecurringExpenses(updated);
  };

  const handleDeleteRecurring = (id: string) => {
    onUpdateRecurringExpenses(recurringExpenses.filter((r) => r.id !== id));
  };

  const isSundayNight = isSundayNightICT(currentDate);

  // Selected archive details
  const activeArchive = useMemo(() => {
    if (!selectedArchiveWeekId && weeklyArchives.length > 0) {
      return weeklyArchives[0];
    }
    return weeklyArchives.find((a) => a.weekId === selectedArchiveWeekId) || null;
  }, [selectedArchiveWeekId, weeklyArchives]);

  const filteredArchiveTransactions = useMemo(() => {
    if (!activeArchive || !activeArchive.transactions) return [];
    return activeArchive.transactions.filter((t) => {
      const text = (t.description || t.notes || '').toLowerCase();
      return (
        archiveSearchQuery.trim() === '' ||
        text.includes(archiveSearchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(archiveSearchQuery.toLowerCase())
      );
    });
  }, [activeArchive, archiveSearchQuery]);

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
                  Financial Money & Expense Tracker
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
                {weekRange.formattedRange} • Cloud Firestore Real-Time Synchronized
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions: Add Income, Log Expense, End Week / Archive */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isSundayNight && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Sunday Reset Window</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowArchiveConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#0B0F17] hover:bg-[#232B3E] text-slate-300 border border-[#232B3E] transition-colors"
            title="Snapshot this week into Cloud Firestore history"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span>End Week / Archive</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal('income')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition-all shadow-sm active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>+ Add Income</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-white transition-all shadow-md active:scale-95"
          >
            <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
            <span>- Log Expense</span>
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
            <span>Financial Overview</span>
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
            onClick={() => {
              setActiveTab('history');
              if (!selectedArchiveWeekId && weeklyArchives.length > 0) {
                setSelectedArchiveWeekId(weeklyArchives[0].weekId);
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-[#232B3E] text-slate-100 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Archive / History ({weeklyArchives.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Firestore: `transactions` & `weekly_archives`</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW & LIFETIME CASH BALANCE DASHBOARD                     */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics Grid (As requested) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Available Balance (Net Cash on Hand) */}
            <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold text-slate-300">Total Available Balance</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                Net Cash on Hand (All-Time)
              </div>
              <div
                className={`text-2xl font-bold font-mono ${
                  totalAvailableBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ${totalAvailableBalance.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between font-mono pt-2 border-t border-[#232B3E]/60">
                <span className="text-emerald-400">+{allTimeIncome.toFixed(2)} in</span>
                <span className="text-slate-500">|</span>
                <span className="text-rose-400">-{allTimeExpenses.toFixed(2)} out</span>
              </div>
            </div>

            {/* KPI 2: Current Week's Total Income */}
            <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold text-slate-300">Current Week's Income</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                Week {currentWeekId} Inflows
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                +${thisWeekIncome.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between font-mono pt-2 border-t border-[#232B3E]/60">
                <span>{thisWeekTransactions.filter((t) => t.type === 'income').length} deposits</span>
                <button
                  type="button"
                  onClick={() => handleOpenModal('income')}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
                >
                  + Add Income
                </button>
              </div>
            </div>

            {/* KPI 3: Current Week's Total Spent */}
            <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold text-slate-300">Current Week's Spent</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                Week {currentWeekId} Outflows
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400">
                ${thisWeekSpent.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between font-mono pt-2 border-t border-[#232B3E]/60">
                <span>{thisWeekTransactions.filter((t) => t.type === 'expense').length} purchases</span>
                <button
                  type="button"
                  onClick={() => handleOpenModal('expense')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold underline"
                >
                  - Log Expense
                </button>
              </div>
            </div>

            {/* KPI 4: Remaining Weekly Budget Cap */}
            <div
              className={`border rounded-xl p-4.5 shadow-sm ${
                remainingWeeklyBudgetCap >= 0
                  ? 'bg-[#161B26] border-[#232B3E]'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold text-slate-300">Remaining Weekly Cap</span>
                <Percent className="w-4 h-4 text-slate-400" />
              </div>

              {isEditingBudget ? (
                <div className="flex items-center gap-1.5 my-1">
                  <span className="text-slate-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="5"
                    value={newBudgetInput}
                    onChange={(e) => setNewBudgetInput(e.target.value)}
                    className="w-20 bg-[#0B0F17] border border-[#232B3E] rounded px-1.5 py-0.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
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
                  <div
                    className={`text-2xl font-bold font-mono ${
                      remainingWeeklyBudgetCap >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ${remainingWeeklyBudgetCap.toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBudgetInput(budgetSettings.weeklyBudgetLimit.toString());
                      setIsEditingBudget(true);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                  >
                    Edit Cap
                  </button>
                </div>
              )}

              <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between font-mono pt-2 border-t border-[#232B3E]/60">
                <span>Cap: ${budgetSettings.weeklyBudgetLimit.toFixed(2)}</span>
                <span
                  className={
                    remainingWeeklyBudgetCap >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                  }
                >
                  {remainingWeeklyBudgetCap >= 0
                    ? `${budgetCapUtilizationPct}% used`
                    : `Over by $${Math.abs(remainingWeeklyBudgetCap).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Budget Consumption Progress Meter */}
          <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-300">
                <span>Weekly Budget Cap Consumption</span>
                <span className="font-mono text-slate-400">
                  ${thisWeekSpent.toFixed(2)} / ${budgetSettings.weeklyBudgetLimit.toFixed(2)}
                </span>
              </div>
              <span
                className={`font-mono font-bold ${
                  budgetCapUtilizationPct > 100
                    ? 'text-rose-400'
                    : budgetCapUtilizationPct > 75
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {budgetCapUtilizationPct}%
              </span>
            </div>

            <div className="w-full h-3 bg-[#0B0F17] rounded-full overflow-hidden p-0.5 border border-[#232B3E]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetCapUtilizationPct > 100
                    ? 'bg-gradient-to-r from-rose-500 to-red-600'
                    : budgetCapUtilizationPct > 75
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, budgetCapUtilizationPct)}%` }}
              ></div>
            </div>

            {/* Category Breakdown Chips */}
            {categoryBreakdown.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Top Spending Breakdown:
                </span>
                {categoryBreakdown.map(([cat, amt]) => {
                  const info = EXPENSE_CATEGORIES[cat] || EXPENSE_CATEGORIES.other;
                  const Icon = info.icon;
                  const pct = Math.round((amt / (thisWeekSpent || 1)) * 100);
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

          {/* Current Week Itemized Transactions Log */}
          <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
            {/* Feed Header with Search & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#232B3E]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Current Week Transactions Log ({filteredTransactions.length})
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Week {currentWeekId}
                </span>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search description..."
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
                  <optgroup label="Expense Categories">
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Income Sources">
                    {Object.entries(INCOME_CATEGORIES).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* List */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-[#0B0F17] border border-[#232B3E] flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-slate-500" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300 mb-1">No Transactions This Week</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Log your income deposits and daily expenses (groceries, fuel, trading capital, coffee) to stay on track.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenModal('income')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Income</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenModal('expense')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-all"
                  >
                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                    <span>Log Expense</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#232B3E]/60">
                {filteredTransactions.map((tx) => {
                  const meta = getCategoryMeta(tx.type, tx.category);
                  const Icon = meta.icon;
                  const isExpense = tx.type === 'expense';
                  const title = tx.description || tx.notes || meta.label;

                  return (
                    <div
                      key={tx.id}
                      className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#0B0F17]/40 rounded-lg transition-colors group"
                    >
                      {/* Left: Icon & Description */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${meta.border} ${meta.bg} ${meta.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-200 truncate">
                              {title}
                            </span>
                            {tx.isRecurring && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                                Fixed Weekly
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 uppercase ${
                                isExpense
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span>{meta.label}</span>
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

                      {/* Right: Amount & Delete */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <span
                            className={`text-base font-bold ${
                              isExpense ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
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

      {/* ==================================================================== */}
      {/* TAB 2: FIXED RECURRING EXPENSES                                      */}
      {/* ==================================================================== */}
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

          {/* Add Custom Recurring Modal */}
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
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expense Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scooter Maintenance"
                    value={newRecTitle}
                    onChange={(e) => setNewRecTitle(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Amount ($ / week)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    placeholder="15.00"
                    value={newRecAmount}
                    onChange={(e) => setNewRecAmount(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select
                    value={newRecCategory}
                    onChange={(e) => setNewRecCategory(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRecurring(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-[#0B0F17] rounded-lg shadow"
                >
                  Save Recurring Item
                </button>
              </div>
            </form>
          )}

          {/* Recurring List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recurringExpenses.map((item) => {
              const info = EXPENSE_CATEGORIES[item.category] || EXPENSE_CATEGORIES.other;
              const Icon = info.icon;
              const isLoggedThisWeek = thisWeekTransactions.some(
                (t) => (t.description || t.notes) === item.title && t.isRecurring
              );

              return (
                <div
                  key={item.id}
                  className={`bg-[#161B26] border rounded-xl p-4 flex items-center justify-between gap-3 transition-all ${
                    item.isEnabled ? 'border-[#232B3E]' : 'border-[#232B3E]/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleRecurring(item.id)}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        item.isEnabled
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'border-slate-700 bg-slate-900 text-transparent'
                      }`}
                      title="Toggle auto-apply"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${info.border} ${info.bg} ${info.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-200 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {info.label.split('/')[0].trim()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-slate-100">
                        ${item.amount.toFixed(2)}
                      </div>
                      {isLoggedThisWeek ? (
                        <span className="text-[10px] text-emerald-400 font-mono font-medium">
                          Logged this week ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Pending
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

      {/* ==================================================================== */}
      {/* TAB 3: ARCHIVE & HISTORICAL SPENDING (Week Selector + Itemized List) */}
      {/* ==================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header */}
          <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Archived Weekly History & Spending Records</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every completed week is saved to Cloud Firestore (`weekly_archives`) with full itemized transactions and summary totals.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowArchiveConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-all self-start sm:self-auto"
            >
              <Archive className="w-3.5 h-3.5 text-amber-400" />
              <span>Snapshot Current Week ({currentWeekId})</span>
            </button>
          </div>

          {weeklyArchives.length === 0 ? (
            <div className="text-center py-16 bg-[#161B26] border border-[#232B3E] rounded-xl p-6">
              <Archive className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-300 mb-1">No Archived Weeks Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                At the end of each week (Sunday midnight ICT) or anytime you want to close a week, click "End Week / Archive" to store a permanent snapshot.
              </p>
              <button
                type="button"
                onClick={handleArchiveWeek}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-[#0B0F17] transition-all shadow"
              >
                <Archive className="w-4 h-4" />
                <span>Archive Current Week {currentWeekId} Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Historical Week Selector Pills / Cards */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2.5">
                  Select Past Week to View Breakdown:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {weeklyArchives.map((arch) => {
                    const isSelected = activeArchive?.weekId === arch.weekId;
                    const isUnder = (arch.budgetLimit || 150) >= arch.totalSpent;
                    return (
                      <button
                        key={arch.weekId}
                        type="button"
                        onClick={() => setSelectedArchiveWeekId(arch.weekId)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-[#1e2638] border-amber-500/50 ring-1 ring-amber-500/40 shadow-md'
                            : 'bg-[#161B26] border-[#232B3E] hover:border-slate-700 hover:bg-[#1a202d]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-sm text-slate-100">
                            {arch.weekId}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              isUnder
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isUnder ? 'Under Cap' : 'Over Cap'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mb-2">
                          {arch.startDate} – {arch.endDate}
                        </div>
                        <div className="flex items-baseline justify-between font-mono text-xs pt-2 border-t border-[#232B3E]/60">
                          <span className="text-slate-400">Spent:</span>
                          <span className="font-bold text-rose-400">
                            ${arch.totalSpent.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between font-mono text-xs mt-0.5">
                          <span className="text-slate-400">Income:</span>
                          <span className="font-bold text-emerald-400">
                            +${(arch.totalIncome || 0).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Week's Complete Breakdown & Transactions List */}
              {activeArchive && (
                <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-sm space-y-5">
                  {/* Selected Week Header Summary Banner */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#232B3E]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-lg text-slate-100">
                          {activeArchive.weekId} Snapshot
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({activeArchive.startDate} to {activeArchive.endDate})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Archived on {new Date(activeArchive.archivedAt).toLocaleString()} • {activeArchive.transactionCount} total records
                      </p>
                    </div>

                    {/* Summary Totals Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-1.5 text-xs font-mono">
                        <span className="text-slate-500 block text-[10px]">TOTAL SPENT</span>
                        <span className="font-bold text-rose-400 text-sm">
                          ${activeArchive.totalSpent.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-1.5 text-xs font-mono">
                        <span className="text-slate-500 block text-[10px]">TOTAL INCOME</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          +${(activeArchive.totalIncome || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-1.5 text-xs font-mono">
                        <span className="text-slate-500 block text-[10px]">NET FLOW</span>
                        <span
                          className={`font-bold text-sm ${
                            activeArchive.netWeeklyFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {activeArchive.netWeeklyFlow >= 0 ? '+' : ''}$
                          {activeArchive.netWeeklyFlow.toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete archive for ${activeArchive.weekId}?`)) {
                            onDeleteWeeklyArchive(activeArchive.weekId);
                          }
                        }}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
                        title="Delete this snapshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filter and Itemized Transaction List for the Selected Week */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                        Itemized Transaction Breakdown ({filteredArchiveTransactions.length})
                      </h4>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search in archive..."
                          value={archiveSearchQuery}
                          onChange={(e) => setArchiveSearchQuery(e.target.value)}
                          className="bg-[#0B0F17] border border-[#232B3E] rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-40"
                        />
                      </div>
                    </div>

                    {filteredArchiveTransactions.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">
                        No transactions found matching search in this archived snapshot.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#232B3E]/60 bg-[#0B0F17] rounded-xl border border-[#232B3E] px-3">
                        {filteredArchiveTransactions.map((tx) => {
                          const meta = getCategoryMeta(tx.type, tx.category);
                          const Icon = meta.icon;
                          const isExpense = tx.type === 'expense';
                          const title = tx.description || tx.notes || meta.label;

                          return (
                            <div
                              key={tx.id}
                              className="py-2.5 px-1 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${meta.border} ${meta.bg} ${meta.color}`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-200 truncate">
                                    {title}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                                    <span>{meta.label}</span>
                                    <span>•</span>
                                    <span>{tx.date}</span>
                                    {tx.time && <span>• {tx.time}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="font-mono text-sm font-bold shrink-0">
                                <span className={isExpense ? 'text-rose-400' : 'text-emerald-400'}>
                                  {isExpense ? '-' : '+'}${Number(tx.amount).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* LOG EXPENSE / ADD INCOME MODAL (Comprehensive & Precise)              */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161B26] border border-[#232B3E] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#232B3E] pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                    formType === 'income'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {formType === 'income' ? (
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {formType === 'income' ? 'Add Income Entry' : 'Log Expense'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Week {currentWeekId} • Asia/Phnom_Penh (ICT)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              {/* Type Switcher: Expense vs Income */}
              <div className="grid grid-cols-2 gap-2 bg-[#0B0F17] p-1 rounded-xl border border-[#232B3E]">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('expense');
                    setFormCategory('grocery_food');
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    formType === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>- Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('income');
                    setFormCategory('tutoring');
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    formType === 'income'
                      ? 'bg-emerald-500 text-[#0B0F17] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+ Income</span>
                </button>
              </div>

              {/* Amount Input & Presets */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-sm font-bold">
                    $
                  </span>
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
                  {(formType === 'expense' ? [2, 5, 10, 20, 35, 50] : [20, 50, 100, 200, 500]).map(
                    (amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFormAmount(amt.toString())}
                        className="px-2 py-1 rounded bg-[#0B0F17] hover:bg-[#232B3E] border border-[#232B3E] text-[11px] font-mono text-slate-300"
                      >
                        +${amt}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Category / Source Selection */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  {formType === 'income' ? 'Income Source / Category' : 'Expense Category'}
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {Object.entries(
                    formType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
                  ).map(([key, info]) => {
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

              {/* Item / Description */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">
                  Item / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formType === 'income'
                      ? 'e.g. Python tutoring session 2h, EUR/USD scalp payout'
                      : 'e.g. Egg batch + bread, Capitol Tour Bus ticket'
                  }
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Date & Time (ICT Defaults) */}
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
                    Time (ICT)
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-[#232B3E] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232B3E]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                    formType === 'income'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-[#0B0F17]'
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  {formType === 'income' ? 'Save Income Entry' : 'Save Expense'}
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
                <h3 className="text-sm font-bold text-slate-100">End Week & Archive?</h3>
                <p className="text-xs text-slate-400">Week {currentWeekId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              This will save a permanent summary snapshot (Total Spent: ${thisWeekSpent.toFixed(2)}, Total Income: +${thisWeekIncome.toFixed(2)}) along with all itemized transactions to the Cloud Firestore `weekly_archives` collection.
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
                onClick={handleArchiveWeek}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-[#0B0F17] transition-all shadow-md"
              >
                Confirm & Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
