import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { Tables } from "@/lib/database.types";

type Profile = Tables<"profiles">;

interface AuthStore {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isAuthenticated: !!session }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),
}));
