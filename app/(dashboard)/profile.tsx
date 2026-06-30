import {
  View, Text, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, RefreshControl,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  Phone, Shield, ChevronRight,
  LogOut, Bell, Lock, HelpCircle, Info, Mail, Calendar, UserCircle, Camera,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { uploadImage } from "@/utils/uploadImage";
import { getInitials, formatDate } from "@/utils/format";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { session, profile: cachedProfile, setProfile } = useAuthStore();
  const [profile, setLocalProfile] = useState(cachedProfile);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const { top } = useSafeAreaInsets();

  async function fetchProfile() {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const { data } = await authService.getProfile(session.user.id);
      if (data) {
        setLocalProfile(data);
        setProfile(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProfile(); }, []);

  async function handleChangeAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Allow photo library access to change your avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0] || !session?.user?.id) return;

    setAvatarUploading(true);
    const url = await uploadImage(`profiles/${session.user.id}`, result.assets[0].uri);
    if (url) {
      await authService.updateProfile(session.user.id, { avatar_url: url });
      const updated = { ...profile, avatar_url: url } as typeof profile;
      setLocalProfile(updated);
      if (updated) setProfile(updated);
    } else {
      Alert.alert("Error", "Failed to upload photo. Please try again.");
    }
    setAvatarUploading(false);
  }

  function confirmLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: signOut },
      ]
    );
  }

  const email = session?.user?.email ?? "";
  const createdAt = session?.user?.created_at ?? profile?.created_at ?? "";
  const provider = (session?.user?.app_metadata?.provider as string) ?? "email";

  const infoRows = [
    { icon: Mail,     label: "Email",       value: email },
    { icon: Phone,    label: "Phone",        value: profile?.phone ?? "—" },
    { icon: Shield,   label: "Role",         value: profile?.role ?? "owner" },
    { icon: Calendar, label: "Member since", value: createdAt ? formatDate(createdAt) : "—" },
    { icon: UserCircle, label: "Login via",  value: provider.charAt(0).toUpperCase() + provider.slice(1) },
  ];

  const sections = [
    {
      title: "Account",
      items: [
        { icon: Lock,       label: "Change Password", color: "#7C3AED", bg: "#F5F3FF" },
        { icon: Shield,     label: "Privacy & Security", color: "#059669", bg: "#ECFDF5" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell,       label: "Notifications",  color: "#D97706", bg: "#FFFBEB" },
        { icon: HelpCircle, label: "Help & Support", color: "#0891B2", bg: "#ECFEFF" },
        { icon: Info,       label: "About App",      color: "#64748B", bg: "#F8FAFC" },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header Banner */}
      <View style={{ paddingTop: top }} className="bg-[#1E3A5F] px-4 pb-8">
        <TouchableOpacity onPress={() => router.back()} className="mb-4 mt-2">
          <Text className="text-blue-300 text-sm">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold mb-5">My Profile</Text>

        <View className="items-center">
          <TouchableOpacity onPress={handleChangeAvatar} className="mb-3" activeOpacity={0.85}>
            <View className="w-24 h-24 rounded-full bg-blue-500 items-center justify-center overflow-hidden border-4 border-white/20">
              {loading || avatarUploading ? (
                <ActivityIndicator color="#fff" />
              ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 96, height: 96 }} resizeMode="cover" />
              ) : (
                <Text className="text-white text-3xl font-bold">
                  {profile?.name ? getInitials(profile.name) : email ? email[0].toUpperCase() : "U"}
                </Text>
              )}
            </View>
            {/* Camera badge */}
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white items-center justify-center"
              style={{ shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}>
              <Camera size={16} color="#2563EB" />
            </View>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">{profile?.name ?? "User"}</Text>
          <View className="mt-1.5 px-3 py-0.5 bg-blue-500/40 rounded-full">
            <Text className="text-blue-200 text-xs capitalize font-medium">{profile?.role ?? "owner"}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchProfile} />}
      >
        {/* User Details Card */}
        <View>
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Account Details
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden border border-slate-100">
            {infoRows.map((row, idx) => {
              const Icon = row.icon;
              return (
                <View
                  key={row.label}
                  className={`flex-row items-center px-4 py-3.5 ${
                    idx < infoRows.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
                    <Icon size={15} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-slate-400">{row.label}</Text>
                    <Text className="text-sm font-medium text-slate-700 capitalize">{row.value}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Menu Sections */}
        {sections.map((section) => (
          <View key={section.title}>
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </Text>
            <View className="bg-white rounded-2xl overflow-hidden border border-slate-100">
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.label}
                    className={`flex-row items-center px-4 py-3.5 ${
                      idx < section.items.length - 1 ? "border-b border-slate-50" : ""
                    }`}
                  >
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: item.bg }}
                    >
                      <Icon size={18} color={item.color} />
                    </View>
                    <Text className="flex-1 text-sm font-medium text-slate-700">{item.label}</Text>
                    <ChevronRight size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          onPress={confirmLogout}
          className="flex-row items-center justify-center bg-red-50 border border-red-100 rounded-2xl py-4 gap-2 mt-2 mb-6"
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="text-red-500 font-semibold text-base">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
