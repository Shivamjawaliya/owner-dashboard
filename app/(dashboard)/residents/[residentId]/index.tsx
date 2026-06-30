import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft, Phone, Mail, Home, CreditCard,
  FileText, Edit2, LogOut, User, Calendar,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getInitials, formatDate, formatCurrency } from "@/utils/format";
import { useResident, useResidents } from "@/hooks/useResidents";

export default function ResidentDetailScreen() {
  const { residentId } = useLocalSearchParams<{ residentId: string }>();
  const { top } = useSafeAreaInsets();
  const { resident, loading } = useResident(residentId);
  const { moveOut } = useResidents();

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!resident) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-8">
        <Text className="text-slate-500 text-center">Resident not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-600 font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const kycVariant =
    resident.kyc_status === "verified"  ? "success" :
    resident.kyc_status === "submitted" ? "primary" :
    resident.kyc_status === "pending"   ? "warning" : "danger";

  function confirmMoveOut() {
    Alert.alert(
      "Initiate Move Out",
      `Are you sure you want to move out ${resident!.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move Out", style: "destructive",
          onPress: async () => {
            const { error } = await moveOut(residentId);
            if (error) Alert.alert("Error", error.message);
            else router.back();
          },
        },
      ]
    );
  }

  const infoRows = [
    { label: "Building",     value: (resident as any).buildings?.name ?? "-" },
    { label: "Room",         value: (resident as any).rooms?.room_number ? `Room ${(resident as any).rooms.room_number}` : "-" },
    { label: "Move-in Date", value: formatDate(resident.move_in_date) },
    { label: "Monthly Rent", value: formatCurrency(resident.monthly_rent) },
    { label: "Deposit",      value: formatCurrency(resident.deposit_amount) },
    ...(resident.move_out_date ? [{ label: "Move-out Date", value: formatDate(resident.move_out_date) }] : []),
  ];

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-[#1E3A5F]" style={{ paddingTop: top }}>
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1">Resident Profile</Text>
          <TouchableOpacity className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
            <Edit2 size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Avatar + name */}
        <View className="items-center pb-6">
          <View className="w-20 h-20 rounded-full bg-blue-400 items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">{getInitials(resident.name)}</Text>
          </View>
          <Text className="text-white text-xl font-bold">{resident.name}</Text>
          {resident.occupation && (
            <Text className="text-blue-200 text-sm mt-0.5">{resident.occupation}</Text>
          )}
          <View className="flex-row gap-2 mt-2">
            <Badge
              label={resident.status === "active" ? "Active" : "Inactive"}
              variant={resident.status === "active" ? "success" : "neutral"}
            />
            <Badge label={`KYC: ${resident.kyc_status}`} variant={kycVariant} />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Contact */}
        <Card>
          <Text className="font-bold text-slate-800 mb-3">Contact Info</Text>
          <View className="gap-3">
            <View className="flex-row items-center">
              <Phone size={16} color="#2563EB" />
              <Text className="text-slate-700 ml-3">{resident.phone}</Text>
            </View>
            {resident.email && (
              <View className="flex-row items-center">
                <Mail size={16} color="#2563EB" />
                <Text className="text-slate-700 ml-3">{resident.email}</Text>
              </View>
            )}
            {resident.gender && (
              <View className="flex-row items-center">
                <User size={16} color="#2563EB" />
                <Text className="text-slate-700 ml-3 capitalize">{resident.gender}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Stay Info */}
        <Card>
          <Text className="font-bold text-slate-800 mb-3">Stay Information</Text>
          <View className="gap-3">
            {infoRows.map((item) => (
              <View key={item.label} className="flex-row items-center justify-between">
                <Text className="text-sm text-slate-400">{item.label}</Text>
                <Text className="text-sm font-semibold text-slate-700">{item.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Emergency Contact */}
        {resident.emergency_contact_name && (
          <Card>
            <Text className="font-bold text-slate-800 mb-3">Emergency Contact</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-400">Name</Text>
                <Text className="text-sm font-semibold text-slate-700">{resident.emergency_contact_name}</Text>
              </View>
              {resident.emergency_contact_phone && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-400">Phone</Text>
                  <Text className="text-sm font-semibold text-slate-700">{resident.emergency_contact_phone}</Text>
                </View>
              )}
              {resident.emergency_contact_relation && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-400">Relation</Text>
                  <Text className="text-sm font-semibold text-slate-700">{resident.emergency_contact_relation}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Quick Actions */}
        <View>
          <Text className="font-bold text-slate-800 mb-3">Quick Actions</Text>
          <View className="flex-row gap-3">
            {[
              { label: "Payments",  icon: CreditCard, color: "#22C55E", bg: "#F0FDF4" },
              { label: "Documents", icon: FileText,   color: "#2563EB", bg: "#EFF6FF" },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <TouchableOpacity
                  key={link.label}
                  className="flex-1 rounded-2xl py-4 items-center border border-slate-100"
                  style={{ backgroundColor: link.bg }}
                >
                  <Icon size={22} color={link.color} />
                  <Text className="text-xs font-semibold mt-2" style={{ color: link.color }}>
                    {link.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Move Out */}
        {resident.status === "active" && (
          <TouchableOpacity
            onPress={confirmMoveOut}
            className="flex-row items-center justify-center bg-red-50 border border-red-100 rounded-2xl py-4 gap-2"
          >
            <LogOut size={18} color="#EF4444" />
            <Text className="text-red-600 font-semibold">Initiate Move Out</Text>
          </TouchableOpacity>
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
