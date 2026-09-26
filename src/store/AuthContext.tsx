import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../shared/types.js';
import { api } from '../services/api.js';
import { auth, signInWithGoogle as firebaseGoogleSignIn, logOutFirebase, firestoreService } from '../services/firebase.js';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('workflowos_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('workflowos_token', idToken);
          setToken(idToken);

          // Sync profile to Firestore
          const profile: any = await firestoreService.syncUserProfile(fbUser);
          
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Google User',
            role: (profile?.role as any) || (fbUser.email === 'dharshandachu3@gmail.com' ? 'ADMIN' : 'OPERATOR'),
            avatarUrl: fbUser.photoURL || undefined,
            createdAt: profile?.createdAt || new Date().toISOString(),
            updatedAt: profile?.updatedAt || new Date().toISOString(),
            passwordHash: '',
          });
        } catch (err) {
          console.error('Error synchronizing Firebase user:', err);
        }
      } else {
        setFirebaseUser(null);
        // If not Firebase authenticated, try restoring token from local storage / backend demo
        const storedToken = localStorage.getItem('workflowos_token');
        if (storedToken && !user) {
          try {
            const currentUser = await api.getMe();
            setUser(currentUser);
          } catch {
            localStorage.removeItem('workflowos_token');
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const fbUser = await firebaseGoogleSignIn();
      const idToken = await fbUser.getIdToken();
      localStorage.setItem('workflowos_token', idToken);
      setToken(idToken);
      
      const profile: any = await firestoreService.syncUserProfile(fbUser);
      setUser({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || 'Google User',
        role: (profile?.role as any) || (fbUser.email === 'dharshandachu3@gmail.com' ? 'ADMIN' : 'OPERATOR'),
        avatarUrl: fbUser.photoURL || undefined,
        createdAt: profile?.createdAt || new Date().toISOString(),
        updatedAt: profile?.updatedAt || new Date().toISOString(),
        passwordHash: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('workflowos_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.register(name, email, password);
      localStorage.setItem('workflowos_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logOutFirebase();
      await api.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('workflowos_token');
      setToken(null);
      setUser(null);
      setFirebaseUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
