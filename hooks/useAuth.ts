import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const { session, user, profile, isAuthenticated, isLoading, setSession, setProfile, setLoading } =
    useAuthStore();

  async function signIn(email: string, password: string) {
    const { data, error } = await authService.signIn(email, password);
    if (error) return { error };
    setSession(data.session);
    if (data.user) {
      const { data: profileData } = await authService.getProfile(data.user.id);
      setProfile(profileData);
    }
    return { error: null };
  }

  async function signUp(email: string, password: string, name: string, phone: string) {
    return authService.signUp(email, password, name, phone);
  }

  async function signInWithGoogle() {
    try {
      // Redirect URI that Google will send the user back to.
      // In Expo Go this becomes exp://<ip>:8081/--/auth/callback
      // In a standalone build it becomes pgowner://auth/callback
      const redirectUri = Linking.createURL("auth/callback");

      const { data, error } = await authService.signInWithGoogle(redirectUri);
      if (error || !data?.url) return { error: error ?? new Error("No OAuth URL returned") };

      // openAuthSessionAsync keeps control in-app: it opens a browser,
      // waits for the redirect URI to be hit, then returns the full URL.
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type !== "success") {
        // User cancelled or browser closed without completing
        return { error: null };
      }

      // Parse tokens from the redirect URL and set the Supabase session
      await handleOAuthRedirect(result.url);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  }

  // Parses the OAuth redirect URL and sets the session in Supabase + store
  async function handleOAuthRedirect(url: string) {
    if (!url) return;

    // Implicit flow: tokens arrive in the hash fragment
    if (url.includes("access_token")) {
      const fragment = url.includes("#") ? url.split("#")[1] : url.split("?")[1] ?? "";
      const params   = new URLSearchParams(fragment);
      const accessToken  = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        const { data } = await supabase.auth.setSession({
          access_token:  accessToken,
          refresh_token: refreshToken,
        });
        if (data.session) await afterSession(data.session);
      }
      return;
    }

    // PKCE flow: an authorization code arrives as a query parameter
    if (url.includes("code=")) {
      // Use string splitting — new URL() can fail on custom exp:// schemes
      const queryString = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const code = params.get("code");
      if (code) {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        if (data.session) await afterSession(data.session);
      }
    }
  }

  async function afterSession(sess: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>) {
    setSession(sess);
    const userId = sess.user.id;

    // Google puts the profile photo in avatar_url OR picture depending on the OAuth version
    const googleAvatar =
      sess.user.user_metadata?.avatar_url ??
      sess.user.user_metadata?.picture ??
      null;

    let { data: profileData } = await authService.getProfile(userId);
    if (!profileData) {
      // First Google sign-in — create profile row
      const name = sess.user.user_metadata?.full_name ?? sess.user.email?.split("@")[0] ?? "User";
      await supabase.from("profiles").insert({
        id:         userId,
        name,
        phone:      null,
        role:       "owner",
        avatar_url: googleAvatar,
      });
      const { data: fresh } = await authService.getProfile(userId);
      profileData = fresh;
    } else if (!profileData.avatar_url && googleAvatar) {
      // Profile exists but has no avatar — backfill from Google
      await authService.updateProfile(userId, { avatar_url: googleAvatar });
      profileData = { ...profileData, avatar_url: googleAvatar };
    }
    setProfile(profileData);
    router.replace("/(dashboard)");
  }

  async function sendPhoneOtp(phone: string) {
    return authService.sendPhoneOtp(phone);
  }

  async function verifyPhoneOtp(phone: string, token: string) {
    const { data, error } = await authService.verifyPhoneOtp(phone, token);
    if (!error && data.session) setSession(data.session);
    return { data, error };
  }

  async function signOut() {
    await authService.signOut();
    setSession(null);
    setProfile(null);
    router.replace("/(auth)/login");
  }

  async function sendPasswordReset(email: string) {
    return authService.sendPasswordResetEmail(email);
  }

  return {
    session,
    user,
    profile,
    isAuthenticated,
    isLoading,
    setLoading,
    setSession,
    setProfile,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    sendPhoneOtp,
    verifyPhoneOtp,
    sendPasswordReset,
  };
}
