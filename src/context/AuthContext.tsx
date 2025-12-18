
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { saveUser } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, companyName: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  daysRemaining: number;
  requestPasswordReset: (email: string) => Promise<string | null>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>; 
  getRegisteredEmailsHint: () => Promise<string[]>;
  refreshUser: () => Promise<void>;
  isRecoveryMode: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper functions
  const checkUserStatus = (u: User): User => {
    const now = new Date();
    if (u.subscriptionStatus === 'ACTIVE' && u.subscriptionExpiryDate) {
      const expiry = new Date(u.subscriptionExpiryDate);
      if (now > expiry) {
        const updatedUser = { ...u, subscriptionStatus: 'EXPIRED' as const };
        saveUser(updatedUser).catch(console.error);
        return updatedUser;
      }
      return u;
    }
    if (u.subscriptionStatus === 'TRIAL') {
      const startDate = new Date(u.trialStartDate);
      const diffTime = now.getTime() - startDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays > 7) {
        const updatedUser = { ...u, subscriptionStatus: 'EXPIRED' as const };
        saveUser(updatedUser).catch(console.error);
        return updatedUser;
      }
    }
    return u;
  };

  const calculateDaysRemaining = (u: User) => {
     if (u.subscriptionStatus === 'EXPIRED') return 0;
     const now = new Date();
     if (u.subscriptionStatus === 'ACTIVE' && u.subscriptionExpiryDate) {
        const expiry = new Date(u.subscriptionExpiryDate);
        const diffTime = expiry.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
     }
     if (u.subscriptionStatus === 'TRIAL') {
       const startDate = new Date(u.trialStartDate);
       const diffTime = now.getTime() - startDate.getTime();
       const diffDays = diffTime / (1000 * 60 * 60 * 24);
       return Math.max(0, Math.ceil(7 - diffDays));
     }
     return 0;
  };

  // Manual refresh function (exposed to context)
  const refreshUser = async () => {
    if (!isSupabaseConfigured) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            const updatedUser = checkUserStatus(profile);
            setUser(updatedUser);
            setDaysRemaining(calculateDaysRemaining(updatedUser));
          }
        }
    } catch (error) {
        console.error("Refresh error:", error);
    }
  };

  // INITIALIZATION EFFECT WITH TIMEOUT RACE
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
        if (!isSupabaseConfigured) {
            if (mounted) setIsLoading(false);
            return;
        }

        // Create a race between the session check and a 2-second timeout
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 2000));
        const sessionPromise = supabase.auth.getSession();

        try {
            const result = await Promise.race([sessionPromise, timeoutPromise]);

            // CASE 1: TIMEOUT
            if (result === 'timeout') {
                console.warn("Session check timed out (2s). Forcing render.");
                if (mounted) {
                    setUser(null);
                    setIsLoading(false);
                }
                return;
            }

            // CASE 2: SESSION RESULT RECEIVED
            const { data, error } = result as any;

            if (error || !data?.session?.user) {
                if (mounted) {
                    setUser(null);
                    setIsLoading(false);
                }
                return;
            }

            // Session valid -> Fetch Profile
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.session.user.id)
                .single();

            if (mounted) {
                if (profile) {
                    const updatedUser = checkUserStatus(profile);
                    setUser(updatedUser);
                    setDaysRemaining(calculateDaysRemaining(updatedUser));
                } else {
                    // Orphaned auth user without profile
                    setUser(null);
                }
                // Release loading state immediately after decision
                setIsLoading(false);
            }

        } catch (e) {
            console.error("Auth init error:", e);
            if (mounted) {
                setUser(null);
                setIsLoading(false);
            }
        }
    };

    initAuth();

    // Event Listener for updates (Login/Logout from other tabs/actions)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      } else if (event === 'SIGNED_OUT') {
        setIsRecoveryMode(false);
        setUser(null);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
             // Passive update (don't block UI)
             supabase.from('users').select('*').eq('id', session.user.id).single()
             .then(({data}) => {
                 if (data) setUser(checkUserStatus(data));
             });
          }
      }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  // --- ACTIONS ---

  const login = async (email: string, password?: string) => {
    if (!password) return false;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refreshUser();
    return true;
  };

  const register = async (name: string, email: string, password: string, companyName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error || !data.user) {
      console.error("Signup error:", error);
      return false;
    }

    const newUser: User = {
      id: data.user.id,
      name,
      email: email.trim().toLowerCase(),
      companyName,
      role: UserRole.ADMIN,
      trialStartDate: new Date().toISOString(),
      subscriptionStatus: 'TRIAL',
      redeemedCodes: []
    };

    const saved = await saveUser(newUser);
    if (!saved) return false;

    await refreshUser();
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsRecoveryMode(false);
  };

  const requestPasswordReset = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: window.location.origin + '/#/reset-password'
    });
    if(error) return null;
    return "check-email";
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  };

  const updatePassword = async (password: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
        setIsRecoveryMode(false);
    }
    return !error;
  };

  const getRegisteredEmailsHint = async () => {
      return [];
  }

  return (
    <AuthContext.Provider value={{ 
      user, login, register, logout, requestPasswordReset, resetPassword, updatePassword, getRegisteredEmailsHint, refreshUser, isAuthenticated: !!user, daysRemaining, isRecoveryMode, isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

