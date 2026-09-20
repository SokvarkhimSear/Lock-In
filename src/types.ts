export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

export type BlockCategory =
  | 'workout'
  | 'class'
  | 'break'
  | 'study'
  | 'commute'
  | 'trading'
  | 'chores'
  | 'teaching'
  | 'night_study'
  | 'free'
  | 'other';

export interface ScheduleBlock {
  id: string;
  title: string;
  courseCode?: string;
  locationOrDetails?: string;
  startTime: string; // "08:30"
  endTime: string;   // "10:00"
  startMinutes: number; // 510
  endMinutes: number;   // 600
  days: DayOfWeek[]; // [1, 3] = Mon, Wed
  category: BlockCategory;
  isContinuation?: boolean;
}

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Assignment {
  id: string;
  courseCode: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // "23:59" or "11:59 PM"
  priority: PriorityLevel;
  isCompleted: boolean;
  alertSent?: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface BlockLog {
  id: string;
  blockId?: string;
  blockName: string;
  timestamp: string;
  status: 'completed' | 'extended' | 'missed';
  notes?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  mode: 'text' | 'checklist';
  tags: string[];
  updatedAt: string;
}

export interface Course {
  code: string;
  name: string;
  color: string;
  iconName?: string;
}

// Financial / Money Tracker Interfaces
export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'grocery_food'       // Grocery / Eggs / Food
  | 'transport_fuel'     // Transport / Fuel
  | 'trading_capital'    // Trading Account Capital / Fees
  | 'coffee_misc'        // Coffee / Miscellaneous
  | 'academic_tech'      // Academic / Books / Tech
  | 'personal_fitness'   // Personal / Health / Gym
  | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  notes?: string;
  date: string; // YYYY-MM-DD (in ICT)
  time: string; // HH:mm (in ICT)
  timestamp: string; // ISO or ICT full timestamp
  weekId: string; // e.g. "2026-W38"
  createdAt?: string;
  isRecurring?: boolean;
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory | string;
  notes?: string;
  isEnabled: boolean;
}

export interface WeeklyArchive {
  id: string; // weekId, e.g. "2026-W38"
  weekId: string; // e.g. "2026-W38"
  startDate: string;
  endDate: string;
  totalSpent: number;
  totalIncome: number;
  netWeeklyFlow: number;
  budgetLimit: number;
  archivedAt: string;
  transactionCount: number;
  transactions: Transaction[];
}

export interface ArchivedWeekSummary {
  weekId: string;
  startDate: string;
  endDate: string;
  totalSpent: number;
  totalIncome: number;
  budgetLimit: number;
  archivedAt: string;
  transactionCount: number;
}

export interface WeeklyFinancialBudget {
  weeklyBudgetLimit: number;
  currentWeekId: string;
  archivedWeeks?: ArchivedWeekSummary[];
}

export type ActiveNavTab = 'dashboard' | 'timetable' | 'assignments' | 'money';

