import { Assignment, BlockLog, NoteItem } from '../types';
import { INITIAL_NOTES } from '../data/scheduleData';
import {
  setFirestoreAssignment,
  deleteFirestoreAssignment,
  setFirestoreNote,
  deleteFirestoreNote,
  addFirestoreBlockLog
} from '../lib/firebase';

const KEYS = {
  ASSIGNMENTS: 'lockin_assignments_user_v2',
  NOTES: 'lockin_scratchpad_items_v2',
  BLOCK_LOGS: 'lockin_block_logs_v1',
  EXTENSIONS: 'lockin_active_extensions_v1',
};

export function getStoredAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem(KEYS.ASSIGNMENTS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredAssignments(assignments: Assignment[]): void {
  try {
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  } catch (e) {
    console.error('Failed to save assignments to local cache:', e);
  }
}

export async function syncSaveAssignment(assignment: Assignment): Promise<void> {
  // Update local cache
  const local = getStoredAssignments();
  const index = local.findIndex((a) => a.id === assignment.id);
  const updated = index >= 0 ? [...local] : [assignment, ...local];
  if (index >= 0) {
    updated[index] = assignment;
  }
  saveStoredAssignments(updated);

  // Sync with Firestore
  try {
    await setFirestoreAssignment(assignment);
  } catch (err) {
    console.warn('Firestore assignment sync warning (saved locally):', err);
  }
}

export async function syncDeleteAssignment(assignmentId: string): Promise<void> {
  const local = getStoredAssignments();
  saveStoredAssignments(local.filter((a) => a.id !== assignmentId));

  try {
    await deleteFirestoreAssignment(assignmentId);
  } catch (err) {
    console.warn('Firestore assignment deletion warning:', err);
  }
}

export function getStoredNotes(): NoteItem[] {
  try {
    const raw = localStorage.getItem(KEYS.NOTES);
    if (!raw) {
      localStorage.setItem(KEYS.NOTES, JSON.stringify(INITIAL_NOTES));
      return INITIAL_NOTES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_NOTES;
  } catch {
    return INITIAL_NOTES;
  }
}

export function saveStoredNotes(notes: NoteItem[]): void {
  try {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes to local cache:', e);
  }
}

export async function syncSaveNote(note: NoteItem): Promise<void> {
  const local = getStoredNotes();
  const index = local.findIndex((n) => n.id === note.id);
  const updated = index >= 0 ? [...local] : [note, ...local];
  if (index >= 0) {
    updated[index] = note;
  }
  saveStoredNotes(updated);

  try {
    await setFirestoreNote(note);
  } catch (err) {
    console.warn('Firestore note sync warning (saved locally):', err);
  }
}

export async function syncDeleteNote(noteId: string): Promise<void> {
  const local = getStoredNotes();
  saveStoredNotes(local.filter((n) => n.id !== noteId));

  try {
    await deleteFirestoreNote(noteId);
  } catch (err) {
    console.warn('Firestore note deletion warning:', err);
  }
}

export function getStoredBlockLogs(): BlockLog[] {
  try {
    const raw = localStorage.getItem(KEYS.BLOCK_LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addStoredBlockLog(log: Omit<BlockLog, 'id' | 'timestamp'>): BlockLog {
  const newLog: BlockLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  try {
    const existing = getStoredBlockLogs();
    const updated = [newLog, ...existing];
    localStorage.setItem(KEYS.BLOCK_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to log block:', e);
  }

  // Push to Firestore asynchronously
  addFirestoreBlockLog(newLog).catch((err) => {
    console.warn('Firestore block log warning:', err);
  });

  return newLog;
}

export function getTodayBlockCompletionCount(): number {
  const logs = getStoredBlockLogs();
  const todayPrefix = new Date().toISOString().split('T')[0];
  return logs.filter((l) => l.timestamp.startsWith(todayPrefix) && l.status === 'completed').length;
}
