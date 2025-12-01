// @refresh reload
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import toast from 'react-hot-toast';
import { checkAndCacheAdminStatus, clearAdminCache } from '../utils/adminCheck';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }
      toast.success('Account created successfully!');
    } catch (error: any) {
      let errorMessage = 'Failed to create account';
      
      // Provide more helpful error messages
      if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Invalid Firebase API key. Please check your .env file.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase project configuration not found. Please verify your Firebase project settings.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Signup error:', error.code, error.message);
      toast.error(errorMessage);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
    } catch (error: any) {
      let errorMessage = 'Failed to sign in';
      
      // Provide more helpful error messages
      if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Invalid Firebase API key. Please check your .env file.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase project configuration not found. Please verify your Firebase project settings.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Please check your email or create an account.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again or use "Forgot password?" to reset it.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format. Please check your email and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please wait a few minutes or reset your password.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support for assistance.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Login error:', error.code, error.message);
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign out';
      toast.error(errorMessage);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send password reset email';
      toast.error(errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Check admin status when user changes
      if (user) {
        const adminStatus = await checkAndCacheAdminStatus(user.uid);
        setIsAdmin(adminStatus);
        console.log('Admin status checked:', adminStatus, 'for user:', user.uid);
      } else {
        setIsAdmin(false);
        clearAdminCache();
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    isAdmin,
    signup,
    login,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

