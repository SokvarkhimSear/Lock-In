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

/**
 * ============================================================================
 * FIREBASE INITIALIZATION & CONFIGURATION
 * ============================================================================
 * Paste your exact firebaseConfig keys from the Firebase Console below:
 */
export const firebaseConfigPlaceholder = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Merges user-pasted configuration with the provisioned Google Firebase project
export const firebaseConfig = {
  apiKey:
    firebaseConfigPlaceholder.apiKey !== "YOUR_FIREBASE_API_KEY"
      ? firebaseConfigPlaceholder.apiKey
      : configJson.apiKey || "AIzaSyAoKVwFbyKR10AAMY3Nxk6ROg-w3zfYKYc",
  authDomain:
    firebaseConfigPlaceholder.authDomain !== "YOUR_PROJECT.firebaseapp.com"
      ? firebaseConfigPlaceholder.authDomain
      : configJson.authDomain || "lock-in-4d28a.firebaseapp.com",
  projectId:
    firebaseConfigPlaceholder.projectId !== "YOUR_PROJECT_ID"
      ? firebaseConfigPlaceholder.projectId
      : configJson.projectId || "lock-in-4d28a",
  storageBucket:
    firebaseConfigPlaceholder.storageBucket !== "YOUR_PROJECT.appspot.com"
      ? firebaseConfigPlaceholder.storageBucket
      : configJson.storageBucket || "lock-in-4d28a.firebasestorage.app",
  messagingSenderId:
    firebaseConfigPlaceholder.messagingSenderId !== "YOUR_SENDER_ID"
      ? firebaseConfigPlaceholder.messagingSenderId
      : configJson.messagingSenderId || "520408032446",
  appId:
    firebaseConfigPlaceholder.appId !== "YOUR_APP_ID"
      ? firebaseConfigPlaceholder.appId
      : configJson.appId || "1:520408032446:web:8aa67b3143656a5f01eaef",
  measurementId: configJson.measurementId || "G-04BEK81GN2"
};

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Database instance: uses the project's default or custom firestore database
export const db = configJson.firestoreDatabaseId
  ? getFirestore(app, configJson.firestoreDatabaseId)
  : getFirestore(app);

// Authentication instance
export const auth = getAuth(app);

// Firestore Collection Names
export const ASSIGNMENTS_COLLECTION = 'assignments';
export const NOTES_COLLECTION = 'notes';
export const BLOCK_LOGS_COLLECTION = 'block_logs';

/**
 * ============================================================================
 * CLOUD FIRESTORE REAL-TIME LISTENERS & CRUD HELPERS
 * ============================================================================
 */

/**
 * Real-time listener (onSnapshot) for Assignments collection:
 * Automatically synchronizes changes across tabs and devices.
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
      console.warn('Firestore assignments subscription warning:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Upsert (Save / Update) an assignment in Cloud Firestore
 */
export async function setFirestoreAssignment(assignment: Assignment): Promise<void> {
  const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignment.id);
  await setDoc(docRef, assignment, { merge: true });
}

/**
 * Delete an assignment from Cloud Firestore
 */
export async function deleteFirestoreAssignment(assignmentId: string): Promise<void> {
  const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
  await deleteDoc(docRef);
}

/**
 * Real-time listener (onSnapshot) for Notes & Scratchpad collection
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
      console.warn('Firestore notes subscription warning:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Upsert (Save / Update) a note in Cloud Firestore
 */
export async function setFirestoreNote(note: NoteItem): Promise<void> {
  const docRef = doc(db, NOTES_COLLECTION, note.id);
  await setDoc(docRef, note, { merge: true });
}

/**
 * Delete a note from Cloud Firestore
 */
export async function deleteFirestoreNote(noteId: string): Promise<void> {
  const docRef = doc(db, NOTES_COLLECTION, noteId);
  await deleteDoc(docRef);
}

/**
 * Save execution block log to Cloud Firestore
 */
export async function addFirestoreBlockLog(log: BlockLog): Promise<void> {
  const docRef = doc(db, BLOCK_LOGS_COLLECTION, log.id);
  await setDoc(docRef, log);
}

/**
 * Real-time listener for block logs
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
      console.warn('Firestore block logs subscription warning:', err);
      if (onError) onError(err);
    }
  );
}
