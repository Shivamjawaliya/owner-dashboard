import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Pressable,
} from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Plus, Bed, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/common/EmptyState";
import PhotoPicker from "@/components/ui/PhotoPicker";
import { formatCurrency } from "@/utils/format";
import { uploadImage } from "@/utils/uploadImage";
import { useRooms } from "@/hooks/useBuildings";

const ROOM_TYPES = ["single", "double", "triple", "dormitory"] as const;
type RoomType = typeof ROOM_TYPES[number];

const DEFAULT_BEDS: Record<RoomType, number> = {
  single: 1, double: 2, triple: 3, dormitory: 6,
};

export default function RoomsScreen() {
  const { buildingId, floorId } = useLocalSearchParams<{ buildingId: string; floorId?: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { rooms, loading, refetch, addRoom } = useRooms(buildingId, floorId);

  const [showModal, setShowModal] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("double");
  const [totalBeds, setTotalBeds] = useState("2");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function openModal() {
    setRoomNumber("");
    setRoomType("double");
    setTotalBeds("2");
    setMonthlyRent("");
    setPhotoUris([]);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  function selectType(type: RoomType) {
    setRoomType(type);
    setTotalBeds(String(DEFAULT_BEDS[type]));
  }

  async function handleSave() {
    if (!roomNumber.trim()) {
      Alert.alert("Error", "Please enter a room number.");
      return;
    }
    const beds = parseInt(totalBeds, 10);
    if (isNaN(beds) || beds < 1) {
      Alert.alert("Error", "Please enter a valid number of beds.");
      return;
    }
    const rent = parseFloat(monthlyRent);
    if (isNaN(rent) || rent < 0) {
      Alert.alert("Error", "Please enter a valid monthly rent.");
      return;
    }
    const exists = rooms.some(
      (r) => r.room_number.toLowerCase() === roomNumber.trim().toLowerCase()
    );
    if (exists) {
      Alert.alert("Error", `Room ${roomNumber} already exists.`);
      return;
    }

    setSaving(true);

    // Upload room photos
    const uploadedUrls: string[] = [];
    for (const uri of photoUris) {
      const url = await uploadImage(`rooms/${buildingId}`, uri);
      if (url) uploadedUrls.push(url);
    }

    const { error } = await addRoom({
      floor_id:     floorId,
      room_number:  roomNumber.trim(),
      type:         roomType,
      total_beds:   beds,
      monthly_rent: rent,
      amenities:    [],
      images:       uploadedUrls,
      status:       "active",
    } as any);
    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message ?? "Failed to add room.");
    } else {
      closeModal();
    }
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white border-b border-slate-100 px-4 pb-3" style={{ paddingTop: top + 8 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800 flex-1">
            Rooms {rooms.length > 0 ? `(${rooms.length})` : ""}
          </Text>
          <TouchableOpacity
            onPress={openModal}
            className="flex-row items-center bg-blue-600 px-3 py-2 rounded-xl gap-1"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-sm font-semibold">Add Room</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      >
        {loading ? (
          <ActivityIndicator color="#2563EB" className="mt-8" />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={<Bed size={40} color="#94A3B8" />}
            title="No rooms yet"
            description="Tap 'Add Room' to add the first room"
            actionLabel="Add Room"
            onAction={openModal}
          />
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {rooms.map((room) => {
              const beds: any[] = room.beds ?? [];
              const occupiedBeds = beds.filter((b) => b.is_occupied).length;
              const totalBedCount = room.total_beds;
              const status =
                occupiedBeds === 0 ? "vacant"
                : occupiedBeds >= totalBedCount ? "full"
                : "partial";
              const badgeVariant =
                status === "full" ? "danger" : status === "vacant" ? "success" : "warning";
              const badgeLabel =
                status === "full" ? "Full" : status === "vacant" ? "Vacant" : "Partial";

              return (
                <TouchableOpacity key={room.id} className="w-[48%]">
                  <Card>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-bold text-slate-800 text-base">#{room.room_number}</Text>
                      <Badge label={badgeLabel} variant={badgeVariant} />
                    </View>
                    <Text className="text-xs text-slate-400 capitalize mb-3">{room.type}</Text>
                    <View className="flex-row items-center mb-1">
                      <Bed size={12} color="#94A3B8" />
                      <Text className="text-xs text-slate-500 ml-1">
                        {occupiedBeds}/{totalBedCount} beds
                      </Text>
                    </View>
                    {/* Bed dots */}
                    <View className="flex-row gap-1 mt-1 mb-3">
                      {Array.from({ length: Math.min(totalBedCount, 8) }).map((_, i) => (
                        <View
                          key={i}
                          className="flex-1 h-1.5 rounded-full"
                          style={{ backgroundColor: i < occupiedBeds ? "#2563EB" : "#E2E8F0" }}
                        />
                      ))}
                    </View>
                    <Text className="text-xs font-bold text-blue-600">
                      {formatCurrency(room.monthly_rent)}/mo
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Room Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable className="flex-1 bg-black/40" onPress={closeModal} />
          <View className="bg-white rounded-t-3xl px-5 pt-5" style={{ paddingBottom: bottom + 16 }}>
            {/* Handle */}
            <View className="w-10 h-1 bg-slate-200 rounded-full self-center mb-4" />

            {/* Title */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-slate-800">Add New Room</Text>
              <TouchableOpacity
                onPress={closeModal}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Room Number */}
            <Text className="text-sm font-semibold text-slate-700 mb-1">Room Number *</Text>
            <TextInput
              value={roomNumber}
              onChangeText={setRoomNumber}
              placeholder="e.g. 101"
              placeholderTextColor="#94A3B8"
              className="border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm mb-4 bg-slate-50"
            />

            {/* Room Type */}
            <Text className="text-sm font-semibold text-slate-700 mb-2">Room Type *</Text>
            <View className="flex-row gap-2 mb-4">
              {ROOM_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => selectType(t)}
                  className={`flex-1 py-2 rounded-xl border items-center ${
                    roomType === t ? "bg-blue-600 border-blue-600" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold capitalize ${
                      roomType === t ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row gap-3 mb-4">
              {/* Total Beds */}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-700 mb-1">Total Beds *</Text>
                <TextInput
                  value={totalBeds}
                  onChangeText={setTotalBeds}
                  keyboardType="numeric"
                  placeholder="2"
                  placeholderTextColor="#94A3B8"
                  className="border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50"
                />
              </View>
              {/* Monthly Rent */}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-700 mb-1">Monthly Rent ₹ *</Text>
                <TextInput
                  value={monthlyRent}
                  onChangeText={setMonthlyRent}
                  keyboardType="numeric"
                  placeholder="8000"
                  placeholderTextColor="#94A3B8"
                  className="border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm bg-slate-50"
                />
              </View>
            </View>

            {/* Room Photos */}
            <PhotoPicker
              photos={photoUris}
              onPhotosChange={setPhotoUris}
              maxPhotos={4}
              label="Room Photos (optional)"
            />

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-blue-600 rounded-2xl py-4 items-center"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Save Room</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
