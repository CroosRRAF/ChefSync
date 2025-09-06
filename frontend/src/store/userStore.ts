import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: 'customer' | 'cook' | 'delivery_agent' | 'admin';
  phone_no?: string;
  address?: string;
  profile_image?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface UserState {
  // State
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isLoggedIn: !!user }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      login: (user) => set({ 
        user, 
        isLoggedIn: true, 
        error: null,
        isLoading: false 
      }),
      
      logout: () => {
        // Clear persisted data from localStorage
        localStorage.removeItem('user-storage');
        set({ 
          user: null, 
          isLoggedIn: false, 
          error: null,
          isLoading: false 
        });
      },
      
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...updates },
            error: null 
          });
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn 
      }),
    }
  )
);

// Selectors for better performance
export const useUser = () => useUserStore((state) => state.user);
export const useIsLoggedIn = () => useUserStore((state) => state.isLoggedIn);
export const useUserRole = () => useUserStore((state) => state.user?.role);
export const useIsLoading = () => useUserStore((state) => state.isLoading);
export const useError = () => useUserStore((state) => state.error);

