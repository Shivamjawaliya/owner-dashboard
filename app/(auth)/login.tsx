import {
  View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { Mail, Lock, Phone } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, isAuthenticated } = useAuth();

  // Auto-navigate when Google auth completes via deep link
  useEffect(() => {
    if (isAuthenticated) router.replace("/(dashboard)");
  }, [isAuthenticated]);

  const TEST_EMAIL = "test@pgowner.com";
  const TEST_PASS  = "Test@123456";

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function loginAsTestUser() {
    try {
      setLoading(true);
      // Try sign in; if no account exists, create it first
      let { error } = await signIn(TEST_EMAIL, TEST_PASS);
      if (error) {
        await signUp(TEST_EMAIL, TEST_PASS, "Test Owner", "9000000000");
        const res = await signIn(TEST_EMAIL, TEST_PASS);
        error = res.error;
      }
      if (error) { Alert.alert("Error", error.message); return; }
      router.replace("/(dashboard)");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      setLoading(true);
      const { error } = await signIn(data.email, data.password);
      if (error) { Alert.alert("Login Failed", error.message); return; }
      router.replace("/(dashboard)");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setGoogleLoading(true);
      const { error } = await signInWithGoogle();
      if (error) { Alert.alert("Google Sign-In Failed", (error as any).message ?? String(error)); }
      // Navigation handled by useEffect watching isAuthenticated
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-[#1E3A5F] pt-20 pb-12 px-6 rounded-b-[40px]">
          <View className="w-16 h-16 rounded-2xl bg-blue-500 items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">P</Text>
          </View>
          <Text className="text-white text-3xl font-bold">Welcome back</Text>
          <Text className="text-blue-300 text-base mt-1">Sign in to your dashboard</Text>
        </View>

        <View className="px-6 pt-8 pb-6">
          {/* Email + Password */}
          <Controller
            control={control} name="email"
            render={({ field: { onChange, value } }) => (
              <Input label="Email Address" placeholder="owner@example.com"
                keyboardType="email-address" autoCapitalize="none"
                onChangeText={onChange} value={value} error={errors.email?.message}
                leftIcon={<Mail size={18} color="#94A3B8" />} />
            )}
          />
          <Controller
            control={control} name="password"
            render={({ field: { onChange, value } }) => (
              <Input label="Password" placeholder="Enter your password"
                onChangeText={onChange} value={value} error={errors.password?.message}
                isPassword leftIcon={<Lock size={18} color="#94A3B8" />} />
            )}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            className="self-end mb-6 -mt-2"
          >
            <Text className="text-blue-600 text-sm font-medium">Forgot Password?</Text>
          </TouchableOpacity>

          <Button label="Sign In" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />

          {/* Dev test button */}
          <TouchableOpacity
            onPress={loginAsTestUser}
            className="mt-3 py-3 border border-dashed border-slate-300 rounded-xl items-center"
          >
            <Text className="text-slate-400 text-xs font-medium">Use Test Account</Text>
            <Text className="text-slate-300 text-xs mt-0.5">{TEST_EMAIL} / {TEST_PASS}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="mx-3 text-slate-400 text-xs font-medium">OR CONTINUE WITH</Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex-row items-center justify-center border border-slate-200 bg-white rounded-xl py-3.5 mb-3"
          >
            {/* Google "G" logo using colored text */}
            <Text style={{ fontSize: 18, fontWeight: "bold", marginRight: 10 }}>
              <Text style={{ color: "#4285F4" }}>G</Text>
              <Text style={{ color: "#EA4335" }}>o</Text>
              <Text style={{ color: "#FBBC05" }}>o</Text>
              <Text style={{ color: "#4285F4" }}>g</Text>
              <Text style={{ color: "#34A853" }}>l</Text>
              <Text style={{ color: "#EA4335" }}>e</Text>
            </Text>
            <Text className="text-slate-700 font-semibold text-sm">
              {googleLoading ? "Opening…" : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          {/* Phone OTP */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/phone-login")}
            className="flex-row items-center justify-center border border-slate-200 bg-white rounded-xl py-3.5"
          >
            <Phone size={18} color="#2563EB" style={{ marginRight: 10 }} />
            <Text className="text-slate-700 font-semibold text-sm">Continue with Phone OTP</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-500 text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text className="text-blue-600 text-sm font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
