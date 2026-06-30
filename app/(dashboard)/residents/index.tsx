import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Users, Plus, Search, Phone, MapPin } from "lucide-react-native";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/common/EmptyState";
import { useResidents } from "@/hooks/useResidents";
import { getInitials, formatDate } from "@/utils/format";

export default function ResidentsScreen() {
  const [search, setSearch] = useState("");
  const { residents, loading, refetch } = useResidents();

  const filtered = residents.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.phone.includes(search)
  );

  return (
    <View className="flex-1">
      <Header
        title="Residents"
        subtitle={`${residents.length} total`}
        rightAction={
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/residents/add")}
            className="flex-row items-center bg-blue-600 px-3 py-2 rounded-xl gap-1"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-sm font-semibold">Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Search */}
      <View className="px-4 py-3 bg-white border-b border-slate-100">
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <Search size={16} color="#94A3B8" />
          <TextInput
            placeholder="Search by name, phone or room..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            className="flex-1 ml-2 text-sm text-slate-800"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={40} color="#94A3B8" />}
            title="No residents found"
            description="Try adjusting your search"
          />
        ) : (
          filtered.map((r) => (
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
                      <Badge
                        label={r.status === "active" ? "Active" : "Inactive"}
                        variant={r.status === "active" ? "success" : "neutral"}
                      />
                    </View>
                    <View className="flex-row items-center mt-1 gap-3">
                      <View className="flex-row items-center">
                        <Phone size={11} color="#94A3B8" />
                        <Text className="text-xs text-slate-400 ml-1">{r.phone}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MapPin size={11} color="#94A3B8" />
                        <Text className="text-xs text-slate-400 ml-1">Room {(r as any).rooms?.room_number ?? "-"}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-400 mt-0.5">{(r as any).buildings?.name ?? ""}</Text>
                  </View>
                  <View className="items-end">
                    <Badge
                      label={r.kyc_status.charAt(0).toUpperCase() + r.kyc_status.slice(1)}
                      variant={
                        r.kyc_status === "verified" ? "success" :
                        r.kyc_status === "submitted" ? "primary" :
                        r.kyc_status === "pending" ? "warning" : "danger"
                      }
                    />
                    <Text className="text-xs text-slate-400 mt-1">
                      Since {formatDate(r.move_in_date)}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
