import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, db, googleProvider, 
  signInWithPopup, onAuthStateChanged,
  doc, getDoc, setDoc, onSnapshot, serverTimestamp
} from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from 'firebase/auth';
import { UserProfile, UserRole } from '../types';

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  tenantId: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }
      // Will be picked up by the profile listener below
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Listen to user profile in Firestore
  useEffect(() => {
    if (!firebaseUser) {
      setUserProfile(null);
      return;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsub = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile({ id: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        // User is authenticated but has no profile yet (new user)
        setUserProfile(null);
      }
    });

    return () => unsub();
  }, [firebaseUser]);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
  };

  const logout = async () => {
    await auth.signOut();
  };

  const value: AuthContextValue = {
    firebaseUser,
    userProfile,
    userRole: userProfile?.role || null,
    tenantId: userProfile?.tenantId || null,
    loading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
