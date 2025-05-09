import React, { useState, useEffect, createContext, PropsWithChildren, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/initSupabase';

type AuthProps = {
  user: User | null;
  session: Session | null;
  initialized?: boolean;
  role?: Role | null;
  signOut?: () => void;
};

export const AuthContext = createContext<Partial<AuthProps>>({});

// Custom hook to read the context values
export function useAuth() {
  return React.useContext(AuthContext);
}

export enum Role {
  ADMIN = 'officer',
  USER = 'clerk',
}
export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>();
  const [name, setName] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    // Listen for changes to authentication state
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session ? session.user : null);
      if (session?.user) {
        // 👇 Fetch role from user_metadata
        const userRole = session.user.user_metadata.role as Role;
        setRole(userRole ?? null);
      } else {
        setRole(Role.USER);
      }
      setInitialized(true);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Log out the user
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(() => ({
    user,
    session,
    initialized,
    role,
    signOut,
  }), [user, session, initialized, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};