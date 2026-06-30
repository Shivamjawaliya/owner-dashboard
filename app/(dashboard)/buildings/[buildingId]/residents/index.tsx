import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Users, Phone, MapPin, Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/common/EmptyState";
import { getInitials, formatDate } from "@/utils/format";
import { residentService } from "@/services/resident.service";

export default function BuildingResidentsScreen() {
  const { buildingId } = useLocalSearchParams<{ buildingId: string }>();
  const { top } = useSafeAreaInsets();
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await residentService.getByBuilding(buildingId);
    setResidents(data ?? []);
    setLoading(false);
  }, [buildingId]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white border-b border-slate-100 px-4 pb-3" style={{ paddingTop: top + 8 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800 flex-1">
            Residents {residents.length > 0 ? `(${residents.length})` : ""}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/residents/add")}
            className="flex-row items-center bg-blue-600 px-3 py-2 rounded-xl gap-1"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-sm font-semibold">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}
      >
        {loading ? (
          <ActivityIndicator color="#2563EB" className="mt-8" />
        ) : residents.length === 0 ? (
          <EmptyState
            icon={<Users size={40} color="#94A3B8" />}
            title="No residents yet"
            description="Add residents to this building"
            actionLabel="Add Resident"
            onAction={() => router.push("/(dashboard)/residents/add")}
          />
        ) : (
          residents.map((r) => {
            const kycVariant =
              r.kyc_status === "verified"  ? "success" :
              r.kyc_status === "submitted" ? "primary" :
              r.kyc_status === "pending"   ? "warning" : "danger";
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => router.push(`/(dashboard)/residents/${r.id}` as never)}
              >
                <Card>
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                      <Text className="text-blue-700 font-bold text-sm">{getInitials(r.name)}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-semibold text-slate-800">{r.name}</Text>
                        <Badge label="Active" variant="success" />
                      </View>
                      <View className="flex-row items-center mt-1 gap-3">
                        <View className="flex-row items-center">
                          <Phone size={11} color="#94A3B8" />
                          <Text className="text-xs text-slate-400 ml-1">{r.phone}</Text>
                        </View>
                        {r.rooms?.room_number && (
                          <View className="flex-row items-center">
                            <MapPin size={11} color="#94A3B8" />
                            <Text className="text-xs text-slate-400 ml-1">Room {r.rooms.room_number}</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-slate-400 mt-0.5">
                        Since {formatDate(r.move_in_date)}
                      </Text>
                    </View>
                    <Badge label={r.kyc_status} variant={kycVariant} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
