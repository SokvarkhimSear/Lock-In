import { Assignment, Course, DayOfWeek, RecurringExpense, ScheduleBlock } from '../types';

export const COURSES: Course[] = [
  { code: 'COSC 121', name: 'Computer Science A', color: 'emerald' },
  { code: 'ITM 201', name: 'Java Programming I', color: 'blue' },
  { code: 'ITM 340', name: 'Maths for Computing', color: 'purple' },
  { code: 'ITM 380', name: 'Cloud Computing', color: 'cyan' },
  { code: 'PSYC 101', name: 'Introductory Psychology', color: 'amber' },
  { code: 'OTHER', name: 'Other / Custom', color: 'slate' },
];

export const MASTER_SCHEDULE: ScheduleBlock[] = [
  // --- WEEKDAYS (Monday - Friday) ---
  // 07:00 AM – 07:40 AM: Workout Block (Strength, Cardio & Mobility)
  {
    id: 'wd-0700-workout',
    title: 'Workout Block',
    locationOrDetails: '🏋️ Strength, Cardio & Mobility (40m)',
    startTime: '07:00',
    endTime: '07:40',
    startMinutes: 420,
    endMinutes: 460,
    days: [1, 2, 3, 4, 5], // Mon - Fri
    category: 'workout',
  },

  // 07:40 AM – 08:00 AM: Shower & Quick Breakfast
  {
    id: 'wd-0740-breakfast',
    title: 'Shower & Quick Breakfast',
    locationOrDetails: '🍳🚿 Eggs + Toast / Fruit & Hygiene (20m)',
    startTime: '07:40',
    endTime: '08:00',
    startMinutes: 460,
    endMinutes: 480,
    days: [1, 2, 3, 4, 5], // Mon - Fri
    category: 'chores',
  },

  // 08:00 AM – 08:30 AM: Morning University Classes & Academic Study
  {
    id: 'wd-0800-prep-study',
    title: 'Morning University Prep & Academic Study',
    locationOrDetails: '🎒 Review Lecture Notes & Commute to Campus',
    startTime: '08:00',
    endTime: '08:30',
    startMinutes: 480,
    endMinutes: 510,
    days: [1, 2, 3, 4, 5], // Mon - Fri
    category: 'study',
  },

  // 08:30 AM – 10:00 AM
  {
    id: 'wd-0830-mon-wed',
    title: 'Cloud Computing',
    courseCode: 'ITM 380',
    locationOrDetails: 'Classroom C11',
    startTime: '08:30',
    endTime: '10:00',
    startMinutes: 510,
    endMinutes: 600,
    days: [1, 3], // Mon, Wed
    category: 'class',
  },
  {
    id: 'wd-0830-tue-thu',
    title: 'Computer Science A',
    courseCode: 'COSC 121',
    locationOrDetails: 'Lecture Theater D3',
    startTime: '08:30',
    endTime: '10:00',
    startMinutes: 510,
    endMinutes: 600,
    days: [2, 4], // Tue, Thu
    category: 'class',
  },
  {
    id: 'wd-0830-fri',
    title: 'Free / Planning',
    locationOrDetails: 'Self-directed buffer',
    startTime: '08:30',
    endTime: '10:00',
    startMinutes: 510,
    endMinutes: 600,
    days: [5], // Fri
    category: 'free',
  },

  // 10:00 AM – 10:15 AM
  {
    id: 'wd-1000-break',
    title: 'Short Break',
    locationOrDetails: '☕ 15m Reset & Hydration',
    startTime: '10:00',
    endTime: '10:15',
    startMinutes: 600,
    endMinutes: 615,
    days: [1, 2, 3], // Mon-Wed
    category: 'break',
  },

  // 10:15 AM – 10:45 AM
  {
    id: 'wd-1015-mon-wed',
    title: 'Intro Psychology',
    courseCode: 'PSYC 101',
    locationOrDetails: 'Classroom D4',
    startTime: '10:15',
    endTime: '10:45',
    startMinutes: 615,
    endMinutes: 645,
    days: [1, 3], // Mon, Wed
    category: 'class',
  },
  {
    id: 'wd-1015-tue-fri',
    title: 'Java Programming I',
    courseCode: 'ITM 201',
    locationOrDetails: 'Classroom D4',
    startTime: '10:15',
    endTime: '10:45',
    startMinutes: 615,
    endMinutes: 645,
    days: [2, 5], // Tue, Fri
    category: 'class',
  },
  {
    id: 'wd-1015-thu',
    title: 'Going Home',
    locationOrDetails: '🚗 Commute',
    startTime: '10:15',
    endTime: '10:45',
    startMinutes: 615,
    endMinutes: 645,
    days: [4], // Thu
    category: 'commute',
  },

  // 10:45 AM – 11:45 AM
  {
    id: 'wd-1045-mon-wed',
    title: 'Intro Psychology (Cont.)',
    courseCode: 'PSYC 101',
    locationOrDetails: 'Classroom D4',
    startTime: '10:45',
    endTime: '11:45',
    startMinutes: 645,
    endMinutes: 705,
    days: [1, 3], // Mon, Wed
    category: 'class',
    isContinuation: true,
  },
  {
    id: 'wd-1045-tue-fri',
    title: 'Java Programming I (Cont.)',
    courseCode: 'ITM 201',
    locationOrDetails: 'Classroom D4',
    startTime: '10:45',
    endTime: '11:45',
    startMinutes: 645,
    endMinutes: 705,
    days: [2, 5], // Tue, Fri
    category: 'class',
    isContinuation: true,
  },
  {
    id: 'wd-1045-thu',
    title: 'Free / Review',
    locationOrDetails: 'Open block',
    startTime: '10:45',
    endTime: '11:45',
    startMinutes: 645,
    endMinutes: 705,
    days: [4], // Thu
    category: 'free',
  },

  // 11:45 AM – 12:45 PM
  {
    id: 'wd-1145-lunch',
    title: 'Lunch',
    locationOrDetails: '🍽️ Refuel & Rest',
    startTime: '11:45',
    endTime: '12:45',
    startMinutes: 705,
    endMinutes: 765,
    days: [1, 2, 3, 4, 5],
    category: 'chores',
  },

  // 12:45 PM – 01:45 PM
  {
    id: 'wd-1245-study',
    title: 'Study Session',
    locationOrDetails: '📚 Focused Academic Work',
    startTime: '12:45',
    endTime: '13:45',
    startMinutes: 765,
    endMinutes: 825,
    days: [1, 2, 3, 4, 5],
    category: 'study',
  },

  // 01:45 PM – 03:15 PM
  {
    id: 'wd-1345-mon-wed',
    title: 'Maths for Computing',
    courseCode: 'ITM 340',
    locationOrDetails: 'Lecture Theater D1',
    startTime: '13:45',
    endTime: '15:15',
    startMinutes: 825,
    endMinutes: 915,
    days: [1, 3], // Mon, Wed
    category: 'class',
  },
  {
    id: 'wd-1345-tue',
    title: 'Study Session',
    locationOrDetails: '📚 Dedicated Coursework',
    startTime: '13:45',
    endTime: '15:15',
    startMinutes: 825,
    endMinutes: 915,
    days: [2], // Tue
    category: 'study',
  },
  {
    id: 'wd-1345-thu-fri',
    title: 'Learn Sth New',
    locationOrDetails: '🧠 Skill Building / Deep Tech',
    startTime: '13:45',
    endTime: '15:15',
    startMinutes: 825,
    endMinutes: 915,
    days: [4, 5], // Thu, Fri
    category: 'study',
  },

  // 03:15 PM – 03:40 PM
  {
    id: 'wd-1515-mon-wed',
    title: 'Going Home',
    locationOrDetails: '🚗 Commute',
    startTime: '15:15',
    endTime: '15:40',
    startMinutes: 915,
    endMinutes: 940,
    days: [1, 3], // Mon, Wed
    category: 'commute',
  },
  {
    id: 'wd-1515-tue',
    title: 'Study Session (Cont.)',
    locationOrDetails: '📚 Focused Work',
    startTime: '15:15',
    endTime: '15:40',
    startMinutes: 915,
    endMinutes: 940,
    days: [2], // Tue
    category: 'study',
    isContinuation: true,
  },
  {
    id: 'wd-1515-thu-fri',
    title: 'Learn Sth New (Cont.)',
    locationOrDetails: '🧠 Continued Skill Acquisition',
    startTime: '15:15',
    endTime: '15:40',
    startMinutes: 915,
    endMinutes: 940,
    days: [4, 5], // Thu, Fri
    category: 'study',
    isContinuation: true,
  },

  // 03:40 PM – 04:40 PM
  {
    id: 'wd-1540-trading',
    title: 'Trading',
    locationOrDetails: '📈 Market Analysis & Execution (1 hr)',
    startTime: '15:40',
    endTime: '16:40',
    startMinutes: 940,
    endMinutes: 1000,
    days: [1, 2, 3, 4, 5],
    category: 'trading',
  },

  // 04:40 PM – 05:30 PM
  {
    id: 'wd-1640-chores',
    title: 'Calm Down + Chores + Cook',
    locationOrDetails: '🧹 Physical Reset & Meal Prep',
    startTime: '16:40',
    endTime: '17:30',
    startMinutes: 1000,
    endMinutes: 1050,
    days: [1, 2, 3, 4, 5],
    category: 'chores',
  },

  // 05:30 PM – 06:30 PM
  {
    id: 'wd-1730-mon-wed-fri',
    title: 'Teach G8 Math',
    locationOrDetails: '🧑‍🏫 Tutoring Session',
    startTime: '17:30',
    endTime: '18:30',
    startMinutes: 1050,
    endMinutes: 1110,
    days: [1, 3, 5], // Mon, Wed, Fri
    category: 'teaching',
  },
  {
    id: 'wd-1730-tue-thu',
    title: 'Learn Sth New',
    locationOrDetails: '🧠 High-Execution Exploration',
    startTime: '17:30',
    endTime: '18:30',
    startMinutes: 1050,
    endMinutes: 1110,
    days: [2, 4], // Tue, Thu
    category: 'study',
  },

  // 06:30 PM – 07:00 PM
  {
    id: 'wd-1830-break',
    title: 'Break',
    locationOrDetails: '☕ 30m Decompress & Snack',
    startTime: '18:30',
    endTime: '19:00',
    startMinutes: 1110,
    endMinutes: 1140,
    days: [1, 2, 3, 4, 5],
    category: 'break',
  },

  // 07:00 PM – 08:00 PM
  {
    id: 'wd-1900-mon-tue',
    title: 'Learn Sth New',
    locationOrDetails: '🧠 Deep Project Building',
    startTime: '19:00',
    endTime: '20:00',
    startMinutes: 1140,
    endMinutes: 1200,
    days: [1, 2], // Mon, Tue
    category: 'study',
  },
  {
    id: 'wd-1900-wed-thu-fri',
    title: 'Teach G11 AP Precalc',
    locationOrDetails: '🧑‍🏫 Advanced Tutoring Session',
    startTime: '19:00',
    endTime: '20:00',
    startMinutes: 1140,
    endMinutes: 1200,
    days: [3, 4, 5], // Wed, Thu, Fri
    category: 'teaching',
  },

  // 08:00 PM – 09:00 PM
  {
    id: 'wd-2000-dinner',
    title: 'Dinner + Shower',
    locationOrDetails: '🚿 Evening Reset & Nutrition',
    startTime: '20:00',
    endTime: '21:00',
    startMinutes: 1200,
    endMinutes: 1260,
    days: [1, 2, 3, 4, 5],
    category: 'chores',
  },

  // 09:00 PM – 10:00 PM
  {
    id: 'wd-2100-prep',
    title: 'Prep Teaching Material',
    locationOrDetails: '📝 Curate Lesson Plans & Problem Sets',
    startTime: '21:00',
    endTime: '22:00',
    startMinutes: 1260,
    endMinutes: 1320,
    days: [1, 2, 3, 4, 5],
    category: 'teaching',
  },

  // 10:00 PM – 12:00 AM
  {
    id: 'wd-2200-night-study',
    title: 'Night Study',
    locationOrDetails: '📚 2 hrs Uninterrupted Execution',
    startTime: '22:00',
    endTime: '24:00',
    startMinutes: 1320,
    endMinutes: 1440,
    days: [1, 2, 3, 4, 5],
    category: 'night_study',
  },

  // --- WEEKEND SCHEDULE (Saturday & Sunday: 6 & 0) ---
  // 08:00 AM – 10:00 AM
  {
    id: 'we-0800-free',
    title: 'Free Time',
    locationOrDetails: '🟢 Morning Walk / Relaxation',
    startTime: '08:00',
    endTime: '10:00',
    startMinutes: 480,
    endMinutes: 600,
    days: [0, 6],
    category: 'free',
  },

  // 10:00 AM – 12:30 PM
  {
    id: 'we-1000-chores',
    title: 'Cook, Chores, Lunch',
    locationOrDetails: '🧹🍽️ Home Maintenance & Nutrition',
    startTime: '10:00',
    endTime: '12:30',
    startMinutes: 600,
    endMinutes: 750,
    days: [0, 6],
    category: 'chores',
  },

  // 12:30 PM – 02:00 PM
  {
    id: 'we-1230-study',
    title: 'Study Session',
    locationOrDetails: '📚 Academic Deep Dive (1.5 hrs)',
    startTime: '12:30',
    endTime: '14:00',
    startMinutes: 750,
    endMinutes: 840,
    days: [0, 6],
    category: 'study',
  },

  // 02:00 PM – 04:00 PM
  {
    id: 'we-1400-learn',
    title: 'Study Something New',
    locationOrDetails: '🧠 Self-Taught Exploration (2 hrs)',
    startTime: '14:00',
    endTime: '16:00',
    startMinutes: 840,
    endMinutes: 960,
    days: [0, 6],
    category: 'study',
  },

  // 04:00 PM – 04:30 PM
  {
    id: 'we-1600-cook',
    title: 'Cook',
    locationOrDetails: '🍳 Quick Food Prep (30m)',
    startTime: '16:00',
    endTime: '16:30',
    startMinutes: 960,
    endMinutes: 990,
    days: [0, 6],
    category: 'chores',
  },

  // 04:30 PM – 09:00 PM
  {
    id: 'we-1630-free',
    title: 'Free Time',
    locationOrDetails: '🟢 Socialize, Chill, Reset (4.5 hrs)',
    startTime: '16:30',
    endTime: '21:00',
    startMinutes: 990,
    endMinutes: 1260,
    days: [0, 6],
    category: 'free',
  },

  // 09:00 PM – 12:00 AM
  {
    id: 'we-2100-study-learn',
    title: 'Study + Learn Something New',
    locationOrDetails: '📚🧠 Late Night Mastery (3 hrs)',
    startTime: '21:00',
    endTime: '24:00',
    startMinutes: 1260,
    endMinutes: 1440,
    days: [0, 6],
    category: 'night_study',
  },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [];

export const DEFAULT_RECURRING_EXPENSES: RecurringExpense[] = [
  {
    id: 'rec-grocery',
    title: 'Grocery, Eggs & Daily Meal Prep',
    amount: 35,
    category: 'grocery_food',
    notes: 'Weekly fresh groceries, eggs, fruits & meal supplies',
    isEnabled: true,
  },
  {
    id: 'rec-fuel',
    title: 'Transport & Scooter Fuel',
    amount: 10,
    category: 'transport_fuel',
    notes: 'Weekly fuel refills & university commute transit',
    isEnabled: true,
  },
  {
    id: 'rec-trading',
    title: 'Trading Account Capital & Broker Fees',
    amount: 25,
    category: 'trading_capital',
    notes: 'Disciplined weekly capital contribution & platform execution fees',
    isEnabled: true,
  },
  {
    id: 'rec-coffee',
    title: 'Coffee & Daily Refreshments',
    amount: 8,
    category: 'coffee_misc',
    notes: 'Morning coffee, cold brews & hydration resets',
    isEnabled: true,
  },
];

export const INITIAL_NOTES = [
  {
    id: 'note-1',
    title: 'Daily Focus & Scratchpad',
    content: `# Daily Focus & Quick Scratchpad
- [x] Complete morning market scan (#trading)
- [ ] Review AVL tree rotation edge cases (#cs)
- [ ] Prepare calculus problem set 3 for tutoring tonight (#teaching)
- [ ] Read distributed consensus whitepaper (#learning)

#ideas
Consider writing a script to auto-sync assignment deadlines with local calendar notifications.`,
    mode: 'text' as const,
    tags: ['#trading', '#cs', '#teaching', '#learning', '#ideas'],
    updatedAt: new Date().toISOString(),
  },
];
