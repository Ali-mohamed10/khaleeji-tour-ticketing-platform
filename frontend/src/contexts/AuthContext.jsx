/**
 * Authentication Context
 *
 * Purpose: Provides auth state (user, profile, loading) to the entire app.
 * Listens to Supabase auth state changes and fetches the user profile.
 *
 * Dependencies: authService, supabaseClient
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as authService from '../services/authService';
import { AuthContext } from './authContextInstance';

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile from DB
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await authService.getProfile(userId);
    if (!error && data) {
      if (data.status === 'suspended') {
        // If suspended, log them out immediately to restrict access
        await authService.signOut();
        setProfile(null);
        setUser(null);
        return;
      }
      setProfile(data);
    } else {
      setProfile(null);
    }
  }, []);

  // Initialize: check existing session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await authService.getSession();
        const currentUser = data?.session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        }
      } catch (err) {
        console.warn('Session restoration failed (possibly expired refresh token). Resetting local session:', err?.message || err);
        try {
          await authService.signOut();
        } catch {
          // Ignore
        }
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }

        // Handle password recovery event
        if (event === 'PASSWORD_RECOVERY') {
          // User clicked reset link — they are now on /reset-password
          // No extra action needed; the page handles it
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Auth actions
  const handleSignUp = useCallback(async (email, password, fullName, phone) => {
    return authService.signUp(email, password, fullName, phone);
  }, []);

  const handleSignIn = useCallback(async (email, password) => {
    return authService.signIn(email, password);
  }, []);

  const handleSignOut = useCallback(async () => {
    const result = await authService.signOut();
    if (!result.error) {
      setUser(null);
      setProfile(null);
    }
    return result;
  }, []);

  const handleResetPassword = useCallback(async (email) => {
    return authService.resetPassword(email);
  }, []);

  const handleUpdatePassword = useCallback(async (newPassword) => {
    return authService.updatePassword(newPassword);
  }, []);

  const handleResendConfirmation = useCallback(async (email) => {
    return authService.resendConfirmationEmail(email);
  }, []);

  const handleUpdateProfile = useCallback(async (updates) => {
    if (!user) return { error: { message: 'Not authenticated' } };
    const result = await authService.updateProfile(user.id, updates);
    if (!result.error && result.data) {
      setProfile(result.data);
    }
    return result;
  }, [user]);

  const value = useMemo(() => ({
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin' && profile?.status === 'active',
    isEditor: profile?.role === 'editor' && profile?.status === 'active',
    isGateStaff: profile?.role === 'gate_staff' && profile?.status === 'active',
    canAccessDashboard: ['admin', 'editor', 'gate_staff'].includes(profile?.role) && profile?.status === 'active',
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    resendConfirmation: handleResendConfirmation,
    updateProfile: handleUpdateProfile,
    checkEmailExists: authService.checkEmailExists,
  }), [
    user,
    profile,
    isLoading,
    handleSignUp,
    handleSignIn,
    handleSignOut,
    handleResetPassword,
    handleUpdatePassword,
    handleResendConfirmation,
    handleUpdateProfile,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
