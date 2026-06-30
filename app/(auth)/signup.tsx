import {
  View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { Mail, Lock, User, Phone } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  name:            z.string().min(2, "Name must be at least 2 characters"),
  email:           z.string().email("Invalid email address"),
  phone:           z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),
  password:        z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match", path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export default function SignupScreen() {
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace("/(dashboard)");
  }, [isAuthenticated]);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      setLoading(true);
      const { error } = await signUp(data.email, data.password, data.name, data.phone);
      if (error) { Alert.alert("Signup Failed", error.message); return; }
      Alert.alert(
        "Check your email",
        "We've sent a confirmation link. Verify it to continue.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    try {
      setGoogleLoading(true);
      const { error } = await signInWithGoogle();
      if (error) { Alert.alert("Google Sign-Up Failed", (error as any).message ?? String(error)); }
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
        <View className="bg-[#1E3A5F] pt-16 pb-10 px-6 rounded-b-[40px]">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-blue-300 text-sm">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold">Create Account</Text>
          <Text className="text-blue-300 text-base mt-1">Start managing your PG today</Text>
        </View>

        <View className="px-6 pt-6 pb-8">
          {/* Google Sign-Up */}
          <TouchableOpacity
            onPress={handleGoogleSignUp}
            disabled={googleLoading}
            className="flex-row items-center justify-center border border-slate-200 bg-white rounded-xl py-3.5 mb-4"
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginRight: 10 }}>
              <Text style={{ color: "#4285F4" }}>G</Text>
              <Text style={{ color: "#EA4335" }}>o</Text>
              <Text style={{ color: "#FBBC05" }}>o</Text>
              <Text style={{ color: "#4285F4" }}>g</Text>
              <Text style={{ color: "#34A853" }}>l</Text>
              <Text style={{ color: "#EA4335" }}>e</Text>
            </Text>
            <Text className="text-slate-700 font-semibold text-sm">
              {googleLoading ? "Opening…" : "Sign up with Google"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-5">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="mx-3 text-slate-400 text-xs font-medium">OR SIGN UP WITH EMAIL</Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          {/* Form */}
          <Controller control={control} name="name"
            render={({ field: { onChange, value } }) => (
              <Input label="Full Name *" placeholder="Rahul Sharma" onChangeText={onChange} value={value}
                error={errors.name?.message} leftIcon={<User size={18} color="#94A3B8" />} />
            )}
          />
          <Controller control={control} name="email"
            render={({ field: { onChange, value } }) => (
              <Input label="Email Address *" placeholder="owner@example.com" keyboardType="email-address"
                autoCapitalize="none" onChangeText={onChange} value={value}
                error={errors.email?.message} leftIcon={<Mail size={18} color="#94A3B8" />} />
            )}
          />
          <Controller control={control} name="phone"
            render={({ field: { onChange, value } }) => (
              <Input label="Phone Number *" placeholder="9876543210" keyboardType="phone-pad"
                onChangeText={onChange} value={value}
                error={errors.phone?.message} leftIcon={<Phone size={18} color="#94A3B8" />} />
            )}
          />
          <Controller control={control} name="password"
            render={({ field: { onChange, value } }) => (
              <Input label="Password *" placeholder="Min 8 characters" onChangeText={onChange}
                value={value} error={errors.password?.message} isPassword
                leftIcon={<Lock size={18} color="#94A3B8" />} />
            )}
          />
          <Controller control={control} name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input label="Confirm Password *" placeholder="Re-enter password" onChangeText={onChange}
                value={value} error={errors.confirmPassword?.message} isPassword
                leftIcon={<Lock size={18} color="#94A3B8" />} />
            )}
          />

          <Button label="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />

          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-500 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text className="text-blue-600 text-sm font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
