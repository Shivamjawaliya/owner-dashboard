import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from "react-native";
import { router } from "expo-router";
import { Building2, Plus, MapPin, Layers, Star } from "lucide-react-native";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/common/EmptyState";
import Badge from "@/components/ui/Badge";
import { useBuildings } from "@/hooks/useBuildings";

export default function BuildingsScreen() {
  const { buildings, loading, refetch } = useBuildings();

  return (
    <View className="flex-1 bg-slate-100">
      <Header
        title="Buildings"
        subtitle={`${buildings.length} properties`}
        rightAction={
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/buildings/add")}
            className="flex-row items-center bg-blue-600 px-3 py-2 rounded-xl gap-1"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-sm font-semibold">Add</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {buildings.length === 0 ? (
          <EmptyState
            icon={<Building2 size={40} color="#94A3B8" />}
            title="No buildings yet"
            description="Add your first PG property to get started"
            actionLabel="Add Building"
            onAction={() => router.push("/(dashboard)/buildings/add")}
          />
        ) : (
          buildings.map((b) => {
            const coverPhoto = b.images?.[0] ?? null;
            return (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.92}
                onPress={() => router.push(`/(dashboard)/buildings/${b.id}` as never)}
                className="bg-white rounded-3xl overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                }}
              >
                {/* Cover photo / placeholder */}
                <View className="w-full" style={{ height: 180 }}>
                  {coverPhoto ? (
                    <Image
                      source={{ uri: coverPhoto }}
                      style={{ width: "100%", height: 180 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="w-full h-full items-center justify-center"
                      style={{ backgroundColor: "#1E3A5F" }}
                    >
                      <Building2 size={52} color="rgba(255,255,255,0.25)" />
                    </View>
                  )}

                  {/* Status badge over image */}
                  <View className="absolute top-3 right-3">
                    <Badge
                      label={b.status === "active" ? "Active" : "Inactive"}
                      variant={b.status === "active" ? "success" : "neutral"}
                    />
                  </View>

                  {/* Photo count pill */}
                  {(b.images?.length ?? 0) > 1 && (
                    <View className="absolute bottom-3 right-3 flex-row items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full">
                      <Star size={10} color="#FCD34D" fill="#FCD34D" />
                      <Text className="text-white text-xs font-semibold">
                        {b.images.length} photos
                      </Text>
                    </View>
                  )}
                </View>

                {/* Card content */}
                <View className="px-4 pt-3 pb-4">
                  <Text className="font-bold text-slate-800 text-lg" numberOfLines={1}>
                    {b.name}
                  </Text>
                  <View className="flex-row items-center mt-1 mb-3">
                    <MapPin size={13} color="#94A3B8" />
                    <Text className="text-slate-400 text-sm ml-1" numberOfLines={1}>
                      {b.address_line1 ? `${b.address_line1}, ` : ""}{b.city}, {b.state}
                    </Text>
                  </View>

                  {/* Stats row */}
                  <View className="flex-row gap-3">
                    <View className="flex-1 flex-row items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-2">
                      <Layers size={13} color="#2563EB" />
                      <Text className="text-xs font-semibold text-slate-600">
                        {b.total_floors} {b.total_floors === 1 ? "Floor" : "Floors"}
                      </Text>
                    </View>
                    <View className="flex-1 flex-row items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-2">
                      <MapPin size={13} color="#8B5CF6" />
                      <Text className="text-xs font-semibold text-slate-600">{b.pincode}</Text>
                    </View>
                    {(b.amenities?.length ?? 0) > 0 && (
                      <View className="flex-1 flex-row items-center gap-1.5 bg-blue-50 rounded-xl px-3 py-2">
                        <Star size={13} color="#F59E0B" fill="#F59E0B" />
                        <Text className="text-xs font-semibold text-blue-700">
                          {b.amenities.length} amenities
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
