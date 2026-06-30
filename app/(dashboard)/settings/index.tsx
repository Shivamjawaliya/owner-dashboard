import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import {
  User, Shield, Building2, Bell, CreditCard, HelpCircle,
  ChevronRight, LogOut, Moon, Smartphone,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUIStore } from "@/store/ui.store";
import Card from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/utils/format";

interface SettingItem {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  onPress?: () => void;
  toggle?: boolean;
  value?: boolean;
  onToggle?: (v: boolean) => void;
}

export default function SettingsScreen() {
  const { top } = useSafeAreaInsets();
  const { toggleSidebar } = useUIStore();
  const { user, signOut } = useAuth();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const SECTIONS: { title: string; items: SettingItem[] }[] = [
    {
      title: "Account",
      items: [
        { label: "Profile",         icon: User,       color: "#2563EB", bg: "#EFF6FF", onPress: () => {} },
        { label: "Security",        icon: Shield,     color: "#8B5CF6", bg: "#F5F3FF", onPress: () => {} },
        { label: "Business Info",   icon: Building2,  color: "#22C55E", bg: "#F0FDF4", onPress: () => {} },
        { label: "Subscription",    icon: CreditCard, color: "#F59E0B", bg: "#FFFBEB", onPress: () => {} },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          label: "Push Notifications", icon: Bell, color: "#EF4444", bg: "#FEF2F2",
          toggle: true, value: notifEnabled, onToggle: setNotifEnabled,
        },
        {
          label: "Dark Mode", icon: Moon, color: "#1E293B", bg: "#F1F5F9",
          toggle: true, value: darkMode, onToggle: setDarkMode,
        },
        { label: "App Version 1.0.0", icon: Smartphone, color: "#94A3B8", bg: "#F8FAFC" },
      ],
    },
    {
      title: "Support",
      items: [
        { label: "Help & Support", icon: HelpCircle, color: "#6366F1", bg: "#EEF2FF", onPress: () => router.push("/(dashboard)/support") },
      ],
    },
  ];

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white border-b border-slate-100 px-4 pb-3" style={{ paddingTop: top + 8 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={toggleSidebar} className="w-9 h-9 rounded-xl bg-slate-50 items-center justify-center mr-3">
            <View className="w-4 h-0.5 bg-slate-700 mb-1" />
            <View className="w-4 h-0.5 bg-slate-700" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800">Settings</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        {user && (
          <Card>
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center mr-4">
                <Text className="text-white text-xl font-bold">{getInitials(user.name)}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800 text-base">{user.name}</Text>
                <Text className="text-slate-400 text-sm">{user.email}</Text>
                <View className="flex-row items-center mt-1">
                  <View className="px-2 py-0.5 bg-blue-100 rounded-full">
                    <Text className="text-blue-700 text-xs font-semibold capitalize">{user.role}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity className="w-9 h-9 rounded-xl bg-slate-50 items-center justify-center">
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">
              {section.title}
            </Text>
            <Card padding={false}>
              {section.items.map((item, i, arr) => {
                const Icon = item.icon;
                const isLast = i === arr.length - 1;
                return (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.toggle ? undefined : item.onPress}
                    className={`flex-row items-center px-4 py-3.5 ${!isLast ? "border-b border-slate-50" : ""}`}
                    disabled={item.toggle || !item.onPress}
                  >
                    <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: item.bg }}>
                      <Icon size={18} color={item.color} />
                    </View>
                    <Text className="flex-1 text-sm font-medium text-slate-700">{item.label}</Text>
                    {item.toggle ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
                        thumbColor="#fff"
                      />
                    ) : item.onPress ? (
                      <ChevronRight size={18} color="#CBD5E1" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-red-50 border border-red-100 rounded-2xl py-4 gap-2"
        >
          <LogOut size={18} color="#EF4444" />
          <Text className="text-red-600 font-semibold">Logout</Text>
        </TouchableOpacity>
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
