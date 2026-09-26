import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on startup
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

// Authentication helpers
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logOutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

// Firestore direct data persistence helpers with error handling
export const firestoreService = {
  // USER PROFILE
  async syncUserProfile(user: FirebaseUser, role = 'OPERATOR') {
    const userPath = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const now = new Date().toISOString();
      if (!snap.exists()) {
        const initialProfile = {
          id: user.uid,
          email: user.email || 'user@workflowos.ai',
          name: user.displayName || 'Enterprise Operator',
          role,
          avatarUrl: user.photoURL || '',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userRef, initialProfile);
        return initialProfile;
      }
      return snap.data();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }
  },

  async getUserProfile(userId: string) {
    const userPath = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, userPath);
    }
  },

  // WORKFLOWS
  async saveWorkflow(userId: string, workflow: any) {
    const path = `users/${userId}/workflows/${workflow.id}`;
    try {
      const ref = doc(db, 'users', userId, 'workflows', workflow.id);
      await setDoc(ref, workflow, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async getWorkflows(userId: string) {
    const path = `users/${userId}/workflows`;
    try {
      const ref = collection(db, 'users', userId, 'workflows');
      const snap = await getDocs(ref);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async deleteWorkflow(userId: string, workflowId: string) {
    const path = `users/${userId}/workflows/${workflowId}`;
    try {
      const ref = doc(db, 'users', userId, 'workflows', workflowId);
      await deleteDoc(ref);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // ACTIVITY EVENTS
  async logActivityEvent(userId: string, event: any) {
    const path = `users/${userId}/activityEvents/${event.id}`;
    try {
      const ref = doc(db, 'users', userId, 'activityEvents', event.id);
      await setDoc(ref, event);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // EXECUTIONS
  async saveExecution(userId: string, execution: any) {
    const path = `users/${userId}/executions/${execution.id}`;
    try {
      const ref = doc(db, 'users', userId, 'executions', execution.id);
      await setDoc(ref, execution, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // NOTIFICATIONS
  async saveNotification(userId: string, notif: any) {
    const path = `users/${userId}/notifications/${notif.id}`;
    try {
      const ref = doc(db, 'users', userId, 'notifications', notif.id);
      await setDoc(ref, notif);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // REALTIME LISTENERS
  subscribeToUserWorkflows(userId: string, onUpdate: (workflows: any[]) => void) {
    const path = `users/${userId}/workflows`;
    const colRef = collection(db, 'users', userId, 'workflows');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const workflows = snapshot.docs.map((doc) => doc.data());
        onUpdate(workflows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },
};
