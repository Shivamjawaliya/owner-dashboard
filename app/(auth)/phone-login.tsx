import {
  View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Phone } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  phone: z
    .string()
    .min(10, "Enter a valid 10-digit phone number")
    .max(10, "Enter a valid 10-digit phone number")
    .regex(/^\d+$/, "Only digits allowed"),
});
type FormData = z.infer<typeof schema>;

export default function PhoneLoginScreen() {
  const [loading, setLoading] = useState(false);
  const { sendPhoneOtp } = useAuth();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
  });

  async function onSubmit({ phone }: FormData) {
    try {
      setLoading(true);
      const fullPhone = `+91${phone}`;
      const { error } = await sendPhoneOtp(fullPhone);
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      router.push({ pathname: "/(auth)/otp-verification", params: { phone } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="bg-[#1E3A5F] pt-16 pb-12 px-6 rounded-b-[40px]">
        <TouchableOpacity onPress={() => router.back()} className="mb-5">
          <Text className="text-blue-300 text-sm">← Back</Text>
        </TouchableOpacity>
        <View className="w-14 h-14 rounded-2xl bg-blue-500 items-center justify-center mb-4">
          <Phone size={28} color="#fff" />
        </View>
        <Text className="text-white text-3xl font-bold">Phone Login</Text>
        <Text className="text-blue-300 text-base mt-1">We'll send an OTP to verify you</Text>
      </View>

      <View className="px-6 pt-8">
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Mobile Number"
              placeholder="Enter 10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
              onChangeText={onChange}
              value={value}
              error={errors.phone?.message}
              leftIcon={
                <View className="flex-row items-center">
                  <Text className="text-slate-500 text-sm font-medium">+91</Text>
                  <View className="w-px h-4 bg-slate-300 ml-2" />
                </View>
              }
            />
          )}
        />

        <Button
          label="Send OTP"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          fullWidth
          size="lg"
        />

        <View className="flex-row justify-center mt-6">
          <Text className="text-slate-500 text-sm">Back to </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text className="text-blue-600 text-sm font-semibold">Email Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
