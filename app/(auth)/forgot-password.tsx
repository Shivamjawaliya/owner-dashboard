import {
  View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Mail } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({ email: z.string().email("Invalid email address") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const { sendPasswordReset } = useAuth();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      setLoading(true);
      const { error } = await sendPasswordReset(data.email);
      if (error) { Alert.alert("Error", error.message); return; }
      setSentEmail(data.email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="bg-[#1E3A5F] pt-16 pb-10 px-6 rounded-b-[40px]">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-blue-300 text-sm">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold">Forgot Password?</Text>
          <Text className="text-blue-300 text-base mt-1">We'll send a reset link to your email</Text>
        </View>

        <View className="px-6 pt-8">
          {sent ? (
            <View className="items-center py-10">
              <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
                <Text className="text-4xl">✉️</Text>
              </View>
              <Text className="text-xl font-bold text-slate-800 mb-2">Email Sent!</Text>
              <Text className="text-slate-500 text-center mb-6">
                Reset link sent to{"\n"}
                <Text className="font-semibold text-slate-700">{sentEmail}</Text>
              </Text>
              <Button label="Back to Login" onPress={() => router.replace("/(auth)/login")} fullWidth />
            </View>
          ) : (
            <>
              <Controller
                control={control} name="email"
                render={({ field: { onChange, value } }) => (
                  <Input label="Email Address" placeholder="owner@example.com"
                    keyboardType="email-address" autoCapitalize="none"
                    onChangeText={onChange} value={value} error={errors.email?.message}
                    leftIcon={<Mail size={18} color="#94A3B8" />} />
                )}
              />
              <Button label="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
