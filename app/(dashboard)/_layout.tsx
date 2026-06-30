import { View, ActivityIndicator } from "react-native";
import { Slot, Redirect } from "expo-router";
import BottomNav from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <View className="flex-1 bg-slate-50">
      <Slot />
      <BottomNav />
    </View>
  );
}
