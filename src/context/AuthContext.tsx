import { getIdTokenResult, User } from "firebase/auth";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { UserProfile } from "@/src/models/types";
import {
  login,
  logout,
  signup,
  subscribeToAuth,
  updateAccountPassword,
  updateAccountProfile,
} from "@/src/services/firebase/auth";
import {
  fetchUserProfile,
  upsertUserProfile,
} from "@/src/services/firebase/firestore";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    displayName: string,
    email: string,
    password: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (
    displayName: string,
    photoURL?: string | null,
  ) => Promise<void>;
  updatePassword: (
    currentPassword: string,
    nextPassword: string,
  ) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function hydrateUserState(nextUser: User | null) {
    setUser(nextUser);
    setProfile(null);
    setIsAdmin(false);

    if (!nextUser) {
      return;
    }

    const [nextProfile, tokenResult] = await Promise.all([
      fetchUserProfile(nextUser.uid).catch(() => null),
      getIdTokenResult(nextUser).catch(() => null),
    ]);

    setProfile(nextProfile);
    setIsAdmin(
      tokenResult?.claims.admin === true ||
        tokenResult?.claims.role === "admin" ||
        nextProfile?.role === "admin",
    );
  }

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (nextUser) => {
      setLoading(true);
      await hydrateUserState(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAdmin,
      loading,
      signIn: async (email, password) => {
        await login(email, password);
      },
      signUp: async (displayName, email, password) => {
        const credential = await signup(displayName, email, password);
        await upsertUserProfile({
          uid: credential.user.uid,
          displayName,
          email,
          photoURL: credential.user.photoURL,
        });
      },
      signOut: async () => {
        await logout();
      },
      updateProfile: async (displayName, photoURL) => {
        if (!user) {
          throw new Error("You must be logged in to manage your profile.");
        }

        await updateAccountProfile(displayName, photoURL);
        await upsertUserProfile({
          uid: user.uid,
          email: user.email ?? profile?.email ?? "",
          displayName,
          photoURL,
        });
        await hydrateUserState(user);
      },
      updatePassword: async (currentPassword, nextPassword) => {
        await updateAccountPassword(currentPassword, nextPassword);
      },
      refreshProfile: async () => {
        await hydrateUserState(user);
      },
    }),
    [isAdmin, loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return context;
}
