export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

export type BlockCategory =
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
