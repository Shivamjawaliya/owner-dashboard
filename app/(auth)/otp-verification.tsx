import { View, Text, TouchableOpacity, Alert, TextInput } from "react-native";
import { useState, useRef, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export default function OTPVerificationScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp]       = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef<TextInput[]>([]);
  const { verifyPhoneOtp, sendPhoneOtp } = useAuth();

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleChange(text: string, idx: number) {
    const newOtp = [...otp];
    newOtp[idx] = text;
    setOtp(newOtp);
    if (text && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKeyPress(key: string, idx: number) {
    if (key === "Backspace" && !otp[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  }

  async function verify() {
    const code = otp.join("");
    if (code.length < 6) { Alert.alert("Error", "Enter the complete 6-digit OTP"); return; }
    try {
      setLoading(true);
      const { error } = await verifyPhoneOtp(`+91${phone ?? ""}`, code);
      if (error) { Alert.alert("Error", error.message); return; }
      router.replace("/(dashboard)");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      setResending(true);
      const { error } = await sendPhoneOtp(`+91${phone ?? ""}`);
      if (error) { Alert.alert("Error", error.message); return; }
      setOtp(["", "", "", "", "", ""]);
      setCountdown(30);
      inputs.current[0]?.focus();
      Alert.alert("Sent!", "A new OTP has been sent to your phone.");
    } finally {
      setResending(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-[#1E3A5F] pt-16 pb-10 px-6 rounded-b-[40px]">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-blue-300 text-sm">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold">Verify OTP</Text>
        <Text className="text-blue-300 text-base mt-1">Sent to +91 {phone ?? "XXXXXXXXXX"}</Text>
      </View>

      <View className="px-6 pt-10">
        <Text className="text-slate-600 text-sm text-center mb-6">
          Enter the 6-digit code sent to your phone
        </Text>

        {/* OTP Boxes */}
        <View className="flex-row justify-center gap-3 mb-8">
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => { if (r) inputs.current[idx] = r; }}
              value={digit}
              onChangeText={(t) => handleChange(t.slice(-1), idx)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, idx)}
              keyboardType="numeric"
              maxLength={1}
              className={`w-12 h-14 border rounded-xl text-center text-xl font-bold text-slate-800 bg-white ${digit ? "border-blue-500" : "border-slate-200"}`}
            />
          ))}
        </View>

        <Button label="Verify OTP" onPress={verify} loading={loading} fullWidth size="lg" />

        {/* Resend */}
        <View className="mt-5 items-center">
          {countdown > 0 ? (
            <Text className="text-slate-500 text-sm">
              Resend OTP in <Text className="text-blue-600 font-semibold">{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={resend} disabled={resending}>
              <Text className="text-slate-500 text-sm">
                Didn't receive code?{" "}
                <Text className="text-blue-600 font-semibold">
                  {resending ? "Sending…" : "Resend OTP"}
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
