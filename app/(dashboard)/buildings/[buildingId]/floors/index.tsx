import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Pressable,
} from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Plus, ChevronRight, DoorOpen, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/common/EmptyState";
import { useFloors } from "@/hooks/useBuildings";

export default function FloorsScreen() {
  const { buildingId } = useLocalSearchParams<{ buildingId: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { floors, loading, refetch, addFloor } = useFloors(buildingId);

  const [showModal, setShowModal] = useState(false);
  const [floorNumber, setFloorNumber] = useState("");
  const [floorName, setFloorName] = useState("");
  const [saving, setSaving] = useState(false);

  function openModal() {
    const nextNumber = floors.length > 0
      ? Math.max(...floors.map((f) => f.floor_number)) + 1
      : 1;
    setFloorNumber(String(nextNumber));
    setFloorName(`Floor ${nextNumber}`);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFloorNumber("");
    setFloorName("");
  }

  async function handleSave() {
    const num = parseInt(floorNumber, 10);
    if (!floorName.trim()) {
      Alert.alert("Error", "Please enter a floor name.");
      return;
    }
    if (isNaN(num) || num < 1) {
      Alert.alert("Error", "Please enter a valid floor number.");
      return;
    }
    const exists = floors.some((f) => f.floor_number === num);
    if (exists) {
      Alert.alert("Error", `Floor ${num} already exists in this building.`);
      return;
    }

    setSaving(true);
    const { error } = await addFloor(num, floorName.trim());
    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message ?? "Failed to add floor.");
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
          <Text className="text-lg font-bold text-slate-800 flex-1">Floors & Rooms</Text>
          <TouchableOpacity
            onPress={openModal}
            className="flex-row items-center bg-blue-600 px-3 py-2 rounded-xl gap-1"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-sm font-semibold">Add Floor</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      >
        {loading ? (
          <ActivityIndicator color="#2563EB" className="mt-8" />
        ) : floors.length === 0 ? (
          <EmptyState
            icon={<DoorOpen size={40} color="#94A3B8" />}
            title="No floors yet"
            description="Tap 'Add Floor' to add the first floor"
            actionLabel="Add Floor"
            onAction={openModal}
          />
        ) : (
          floors.map((floor) => {
            const rooms: any[] = floor.rooms ?? [];
            const totalRooms = rooms.length;

            return (
              <TouchableOpacity
                key={floor.id}
                onPress={() =>
                  router.push(`/(dashboard)/buildings/${buildingId}/rooms?floorId=${floor.id}` as never)
                }
              >
                <Card>
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center mr-3">
                      <Text className="text-blue-600 font-bold text-lg">{floor.floor_number}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-slate-800">{floor.name}</Text>
                      <View className="flex-row items-center mt-1">
                        <DoorOpen size={12} color="#94A3B8" />
                        <Text className="text-xs text-slate-400 ml-1">
                          {totalRooms} {totalRooms === 1 ? "room" : "rooms"}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#CBD5E1" />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Floor Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable className="flex-1 bg-black/40" onPress={closeModal} />
          <View
            className="bg-white rounded-t-3xl px-5 pt-5"
            style={{ paddingBottom: bottom + 16 }}
          >
            {/* Handle */}
            <View className="w-10 h-1 bg-slate-200 rounded-full self-center mb-4" />

            {/* Title row */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-slate-800">Add New Floor</Text>
              <TouchableOpacity onPress={closeModal} className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Floor Number */}
            <Text className="text-sm font-semibold text-slate-700 mb-1">Floor Number *</Text>
            <TextInput
              value={floorNumber}
              onChangeText={setFloorNumber}
              keyboardType="numeric"
              placeholder="e.g. 1"
              placeholderTextColor="#94A3B8"
              className="border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm mb-4 bg-slate-50"
            />

            {/* Floor Name */}
            <Text className="text-sm font-semibold text-slate-700 mb-1">Floor Name *</Text>
            <TextInput
              value={floorName}
              onChangeText={setFloorName}
              placeholder="e.g. Ground Floor"
              placeholderTextColor="#94A3B8"
              className="border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm mb-6 bg-slate-50"
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
                <Text className="text-white font-bold text-base">Save Floor</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
