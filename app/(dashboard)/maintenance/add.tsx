import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, Modal, Pressable, FlatList,
} from "react-native";
import { useState, useMemo } from "react";
import { router } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SuggestInput from "@/components/ui/SuggestInput";
import { useBuildings, useRooms } from "@/hooks/useBuildings";
import { useResidents } from "@/hooks/useResidents";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthStore } from "@/store/auth.store";
import { maintenanceService } from "@/services/maintenance.service";

const CATEGORIES = ["electricity", "water", "internet", "plumbing", "carpentry", "cleaning", "AC/Cooling", "other"] as const;
type Category = typeof CATEGORIES[number];

const PRIORITIES = ["high", "medium", "low"] as const;
type Priority = typeof PRIORITIES[number];

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#EF4444", medium: "#F59E0B", low: "#22C55E",
};

const CAT_ICONS: Record<Category, string> = {
  electricity: "⚡", water: "💧", internet: "📶", plumbing: "🔧",
  carpentry: "🪚", cleaning: "🧹", "AC/Cooling": "❄️", other: "🔩",
};

export default function AddMaintenanceScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { session }     = useAuthStore();
  const { buildings }   = useBuildings();
  const { residents }   = useResidents();
  const { employees }   = useEmployees();

  const reportedBySuggestions = useMemo(() => {
    const names = [
      ...residents.map((r) => r.name),
      ...employees.map((e) => e.name),
    ];
    return [...new Set(names)].sort();
  }, [residents, employees]);

  const [title, setTitle]                       = useState("");
  const [description, setDescription]           = useState("");
  const [reportedBy, setReportedBy]             = useState("");
  const [category, setCategory]                 = useState<Category>("other");
  const [priority, setPriority]                 = useState<Priority>("medium");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedRoomId, setSelectedRoomId]     = useState("");
  const [showBuildingPicker, setShowBuildingPicker] = useState(false);
  const [showRoomPicker, setShowRoomPicker]     = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [titleError, setTitleError]             = useState("");
  const [buildingError, setBuildingError]       = useState("");

  const { rooms } = useRooms(selectedBuildingId, undefined);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const selectedRoom     = rooms.find((r) => r.id === selectedRoomId);

  function pickBuilding(id: string) {
    setSelectedBuildingId(id);
    setSelectedRoomId("");
    setShowBuildingPicker(false);
    setBuildingError("");
  }

  async function handleSubmit() {
    let valid = true;
    if (!title.trim()) { setTitleError("Title is required"); valid = false; }
    if (!selectedBuildingId) { setBuildingError("Please select a building"); valid = false; }
    if (!valid) return;

    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const { error } = await maintenanceService.create({
        owner_id:    session.user.id,
        building_id: selectedBuildingId,
        room_id:     selectedRoomId || null,
        title:       title.trim(),
        description: description.trim() || null,
        category,
        priority,
        status:      "open",
        reported_by: reportedBy.trim() || null,
        assigned_to: null,
        resolved_at: null,
      });
      if (error) throw error;
      Alert.alert("Success", "Maintenance ticket created!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to create ticket.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="bg-white border-b border-slate-100 px-4 pb-3" style={{ paddingTop: top + 8 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800 flex-1">New Maintenance Ticket</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title & Description */}
        <Card>
          <Text className="font-bold text-slate-800 mb-4">Ticket Details</Text>

          <Text className="text-sm font-medium text-slate-700 mb-1.5">Title *</Text>
          <TextInput
            value={title}
            onChangeText={(t) => { setTitle(t); setTitleError(""); }}
            placeholder="e.g. Water leakage in bathroom"
            placeholderTextColor="#94A3B8"
            className={`border rounded-xl px-4 py-3 text-sm text-slate-800 bg-white mb-1 ${titleError ? "border-red-400" : "border-slate-200"}`}
          />
          {titleError ? <Text className="text-xs text-red-500 mb-2">{titleError}</Text> : null}

          <Text className="text-sm font-medium text-slate-700 mb-1.5 mt-1">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white"
            style={{ minHeight: 80 }}
          />

          <SuggestInput
            label="Reported By"
            placeholder="Resident / staff name (optional)"
            value={reportedBy}
            suggestions={reportedBySuggestions}
            onChangeText={setReportedBy}
            onSelect={setReportedBy}
          />
        </Card>

        {/* Category */}
        <Card>
          <Text className="font-bold text-slate-800 mb-3">Category *</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                  category === c ? "bg-blue-50 border-blue-400" : "bg-slate-50 border-slate-200"
                }`}
              >
                <Text className="text-sm">{CAT_ICONS[c]}</Text>
                <Text className={`text-sm font-medium capitalize ${category === c ? "text-blue-600" : "text-slate-500"}`}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Priority */}
        <Card>
          <Text className="font-bold text-slate-800 mb-3">Priority *</Text>
          <View className="flex-row gap-3">
            {PRIORITIES.map((p) => {
              const active = priority === p;
              const color  = PRIORITY_COLORS[p];
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  className="flex-1 items-center py-3 rounded-xl border"
                  style={active ? { backgroundColor: color + "15", borderColor: color } : { borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" }}
                >
                  <View className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: active ? color : "#CBD5E1" }} />
                  <Text className="text-sm font-semibold capitalize" style={active ? { color } : { color: "#94A3B8" }}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Location */}
        <Card>
          <Text className="font-bold text-slate-800 mb-4">Location</Text>

          <Text className="text-sm font-medium text-slate-700 mb-1.5">Building *</Text>
          <TouchableOpacity
            onPress={() => setShowBuildingPicker(true)}
            className={`flex-row items-center border rounded-xl px-4 py-3 bg-slate-50 mb-1 ${buildingError ? "border-red-400" : "border-slate-200"}`}
          >
            <Text className={`flex-1 text-sm ${selectedBuilding ? "text-slate-800" : "text-slate-400"}`}>
              {selectedBuilding?.name ?? "Select building..."}
            </Text>
          </TouchableOpacity>
          {buildingError ? <Text className="text-xs text-red-500 mb-2">{buildingError}</Text> : null}

          <Text className="text-sm font-medium text-slate-700 mb-1.5 mt-2">Room (optional)</Text>
          <TouchableOpacity
            onPress={() => selectedBuildingId ? setShowRoomPicker(true) : Alert.alert("", "Select a building first")}
            className="flex-row items-center border border-slate-200 rounded-xl px-4 py-3 bg-slate-50"
          >
            <Text className={`flex-1 text-sm ${selectedRoom ? "text-slate-800" : "text-slate-400"}`}>
              {selectedRoom ? `Room ${selectedRoom.room_number}` : "Select room..."}
            </Text>
            {selectedRoom && (
              <TouchableOpacity onPress={() => setSelectedRoomId("")}>
                <Text className="text-xs text-red-400">Clear</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </Card>

        <Button label="Create Ticket" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
        <View className="h-8" />
      </ScrollView>

      {/* Building Picker */}
      <Modal visible={showBuildingPicker} transparent animationType="slide" onRequestClose={() => setShowBuildingPicker(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowBuildingPicker(false)} />
        <View className="bg-white rounded-t-3xl" style={{ paddingBottom: bottom + 16, maxHeight: "50%" }}>
          <View className="w-10 h-1 bg-slate-200 rounded-full self-center mt-4 mb-3" />
          <Text className="text-base font-bold text-slate-800 px-5 mb-3">Select Building</Text>
          <FlatList
            data={buildings}
            keyExtractor={(b) => b.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => pickBuilding(item.id)}
                className="flex-row items-center px-5 py-3.5 border-b border-slate-50"
              >
                <Text className="flex-1 text-sm text-slate-700">{item.name}</Text>
                {selectedBuildingId === item.id && <Check size={16} color="#2563EB" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Room Picker */}
      <Modal visible={showRoomPicker} transparent animationType="slide" onRequestClose={() => setShowRoomPicker(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowRoomPicker(false)} />
        <View className="bg-white rounded-t-3xl" style={{ paddingBottom: bottom + 16, maxHeight: "50%" }}>
          <View className="w-10 h-1 bg-slate-200 rounded-full self-center mt-4 mb-3" />
          <Text className="text-base font-bold text-slate-800 px-5 mb-3">Select Room</Text>
          <FlatList
            data={rooms}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { setSelectedRoomId(item.id); setShowRoomPicker(false); }}
                className="flex-row items-center px-5 py-3.5 border-b border-slate-50"
              >
                <Text className="flex-1 text-sm text-slate-700">Room {item.room_number} ({item.type})</Text>
                {selectedRoomId === item.id && <Check size={16} color="#2563EB" />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text className="text-center text-slate-400 py-6 text-sm">No rooms found for this building</Text>
            }
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
