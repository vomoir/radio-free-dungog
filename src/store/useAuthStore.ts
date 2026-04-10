import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

// In a real app, you might check a Firestore role or custom claim.
// For simplicity, we'll check if the email matches a specific admin email.
const ADMIN_EMAIL = 'vomoir@gmail.com';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isAdmin: false,
  setUser: (user) => set({ 
    user, 
    isAdmin: user?.email === ADMIN_EMAIL,
    loading: false 
  }),
  setLoading: (loading) => set({ loading }),
}));

// Initialize listener
onAuthStateChanged(auth, (user) => {
  useAuthStore.getState().setUser(user);
});
