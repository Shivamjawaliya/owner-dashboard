import { supabase } from "@/lib/supabase";

export const authService = {
  async signInWithGoogle(redirectTo: string) {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
  },


  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string, name: string, phone: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });
    if (error) return { data: null, error };

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        name,
        phone,
        role: "owner",
      });
    }
    return { data, error: null };
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async sendPhoneOtp(phone: string) {
    return supabase.auth.signInWithOtp({ phone });
  },

  async verifyPhoneOtp(phone: string, token: string) {
    return supabase.auth.verifyOtp({ phone, token, type: "sms" });
  },

  async sendPasswordResetEmail(email: string) {
    return supabase.auth.resetPasswordForEmail(email);
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  async getProfile(userId: string) {
    return supabase.from("profiles").select("*").eq("id", userId).single();
  },

  async updateProfile(userId: string, data: { name?: string; phone?: string; avatar_url?: string }) {
    return supabase.from("profiles").update(data).eq("id", userId);
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
