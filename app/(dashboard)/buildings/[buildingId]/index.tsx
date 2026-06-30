import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Users, Edit2, MapPin, Layers } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useBuilding } from "@/hooks/useBuildings";

const QUICK_LINKS = [
  { label: "Floors & Rooms", icon: Layers, color: "#2563EB", bg: "#EFF6FF", route: "floors" },
  { label: "Residents",      icon: Users,  color: "#8B5CF6", bg: "#F5F3FF", route: "residents" },
];

export default function BuildingDetailScreen() {
  const { buildingId } = useLocalSearchParams<{ buildingId: string }>();
  const { top } = useSafeAreaInsets();
  const { building, loading } = useBuilding(buildingId);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!building) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-8">
        <Text className="text-slate-500 text-center">Building not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-600 font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-[#1E3A5F]" style={{ paddingTop: top }}>
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1" numberOfLines={1}>
            {building.name}
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/(dashboard)/buildings/${buildingId}/edit` as never)}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
          >
            <Edit2 size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View className="flex-row px-4 pb-5 gap-4">
          <View className="flex-1 items-center bg-white/10 rounded-xl py-3">
            <Text className="text-white text-xl font-bold">{building.total_floors}</Text>
            <Text className="text-blue-200 text-xs mt-0.5">Floors</Text>
          </View>
          <View className="flex-1 items-center bg-white/10 rounded-xl py-3">
            <Text className="text-white text-xl font-bold">{building.amenities?.length ?? 0}</Text>
            <Text className="text-blue-200 text-xs mt-0.5">Amenities</Text>
          </View>
          <View className="flex-1 items-center bg-white/10 rounded-xl py-3">
            <Text className="text-white text-xl font-bold capitalize">{building.status}</Text>
            <Text className="text-blue-200 text-xs mt-0.5">Status</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Info Card */}
        <Card>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-bold text-slate-800">Property Info</Text>
            <Badge
              label={building.status === "active" ? "Active" : "Inactive"}
              variant={building.status === "active" ? "success" : "neutral"}
            />
          </View>
          <View className="flex-row items-center mb-2">
            <MapPin size={14} color="#94A3B8" />
            <Text className="text-slate-500 text-sm ml-1">
              {building.address_line1}, {building.city}, {building.state} — {building.pincode}
            </Text>
          </View>

          {building.amenities && building.amenities.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-3 pt-3 border-t border-slate-50">
              {building.amenities.map((a) => (
                <View key={a} className="px-2.5 py-1 bg-blue-50 rounded-full">
                  <Text className="text-xs text-blue-600 font-medium">{a}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Quick Links */}
        <View>
          <Text className="font-bold text-slate-800 mb-3">Manage</Text>
          <View className="flex-row flex-wrap gap-3">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <TouchableOpacity
                  key={link.label}
                  onPress={() =>
                    router.push(`/(dashboard)/buildings/${buildingId}/${link.route}` as never)
                  }
                  className="flex-1 min-w-[140px] rounded-2xl py-5 items-center border border-slate-100"
                  style={{ backgroundColor: link.bg }}
                >
                  <Icon size={26} color={link.color} />
                  <Text className="text-sm font-semibold mt-2" style={{ color: link.color }}>
                    {link.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
