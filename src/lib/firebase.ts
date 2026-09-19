import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';
import { Assignment, NoteItem, BlockLog } from '../types';

// The user provided config and system provisioned values
export const firebaseConfig = {
  apiKey: configJson.apiKey || "AIzaSyAoKVwFbyKR10AAMY3Nxk6ROg-w3zfYKYc",
  authDomain: configJson.authDomain || "lock-in-4d28a.firebaseapp.com",
  projectId: configJson.projectId || "lock-in-4d28a",
  storageBucket: configJson.storageBucket || "lock-in-4d28a.firebasestorage.app",
  messagingSenderId: configJson.messagingSenderId || "520408032446",
  appId: configJson.appId || "1:520408032446:web:8aa67b3143656a5f01eaef",
  measurementId: configJson.measurementId || "G-04BEK81GN2"
};

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Database ID: if customized in config, connect to that database or default
export const db = configJson.firestoreDatabaseId
  ? getFirestore(app, configJson.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Collection References
export const ASSIGNMENTS_COLLECTION = 'assignments';
export const NOTES_COLLECTION = 'notes';
export const BLOCK_LOGS_COLLECTION = 'block_logs';

/**
 * Realtime sync helper for Assignments collection
 */
export function subscribeToAssignments(
  onUpdate: (assignments: Assignment[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, ASSIGNMENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Assignment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Assignment;
        items.push({
          ...data,
          id: docSnap.id
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.warn('Firestore assignments subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Upsert assignment into Firestore
 */
export async function setFirestoreAssignment(assignment: Assignment): Promise<void> {
  const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignment.id);
  await setDoc(docRef, assignment, { merge: true });
}

/**
 * Delete assignment from Firestore
 */
export async function deleteFirestoreAssignment(assignmentId: string): Promise<void> {
  const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
  await deleteDoc(docRef);
}

/**
 * Realtime sync helper for Notes collection
 */
export function subscribeToNotes(
  onUpdate: (notes: NoteItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, NOTES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: NoteItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as NoteItem;
        items.push({
          ...data,
          id: docSnap.id
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.warn('Firestore notes subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Upsert note into Firestore
 */
export async function setFirestoreNote(note: NoteItem): Promise<void> {
  const docRef = doc(db, NOTES_COLLECTION, note.id);
  await setDoc(docRef, note, { merge: true });
}

/**
 * Delete note from Firestore
 */
export async function deleteFirestoreNote(noteId: string): Promise<void> {
  const docRef = doc(db, NOTES_COLLECTION, noteId);
  await deleteDoc(docRef);
}

/**
 * Log a schedule block completion or extension
 */
export async function addFirestoreBlockLog(log: BlockLog): Promise<void> {
  const docRef = doc(db, BLOCK_LOGS_COLLECTION, log.id);
  await setDoc(docRef, log);
}

/**
 * Subscribe to block logs for live streaks & counts
 */
export function subscribeToBlockLogs(
  onUpdate: (logs: BlockLog[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, BLOCK_LOGS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const logs: BlockLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as BlockLog);
      });
      onUpdate(logs);
    },
    (err) => {
      console.warn('Firestore block logs subscription error:', err);
      if (onError) onError(err);
    }
  );
}
