import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';

import { login, logout, signup, subscribeToAuth } from '@/src/services/firebase/auth';
import { ensureDefaultMembership } from '@/src/services/firebase/groups';
import { upsertUserProfile } from '@/src/services/firebase/firestore';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        const credential = await login(email, password);
        await ensureDefaultMembership(credential.user.uid);
      },
      signUp: async (displayName, email, password) => {
        const credential = await signup(displayName, email, password);
        await upsertUserProfile({
          uid: credential.user.uid,
          displayName,
          email,
        });
        await ensureDefaultMembership(credential.user.uid);
      },
      signOut: async () => {
        await logout();
      },
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }

  return context;
}
