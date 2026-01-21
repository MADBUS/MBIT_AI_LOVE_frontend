import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

interface UserState {
  user: User | null;
  isLoading: boolean;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updateMbti: (mbti: string) => void;
  clearUser: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isHydrated: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      updateMbti: (mbti) =>
        set((state) => ({
          user: state.user ? { ...state.user, mbti } : null,
        })),
      clearUser: () => set({ user: null }),
      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
