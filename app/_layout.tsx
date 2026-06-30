import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";

WebBrowser.maybeCompleteAuthSession();

async function handleOAuthUrl(url: string) {
  if (!url) return;
  try {
    // Implicit flow — tokens in hash fragment
    if (url.includes("access_token")) {
      const hash = url.includes("#") ? url.split("#")[1] : url.split("?")[1] ?? "";
      const params = new URLSearchParams(hash);
      const accessToken  = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
      return;
    }
    // PKCE flow — code in query params
    if (url.includes("code=")) {
      // Use string splitting — new URL() can fail on custom exp:// schemes
      const queryString = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const code = params.get("code");
      if (code) await supabase.auth.exchangeCodeForSession(code);
    }
  } catch (e) {
    console.warn("OAuth URL handling error:", e);
  }
}

export default function RootLayout() {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Handle deep link that opened the app (cold start from OAuth redirect)
    Linking.getInitialURL().then((url) => { if (url) handleOAuthUrl(url); });

    // Handle deep link while app is running (warm start from OAuth redirect)
    const linkSub = Linking.addEventListener("url", ({ url }) => handleOAuthUrl(url));

    // Restore session on app start
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const { data } = await authService.getProfile(session.user.id);
        setProfile(data);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const { data } = await authService.getProfile(session.user.id);
          setProfile(data);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => { subscription.unsubscribe(); linkSub.remove(); };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(dashboard)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
