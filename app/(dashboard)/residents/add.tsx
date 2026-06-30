import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Modal, Pressable, FlatList, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ChevronDown, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useBuildings, useRooms } from "@/hooks/useBuildings";
import { useAuthStore } from "@/store/auth.store";
import { residentService } from "@/services/resident.service";
import { buildingService } from "@/services/building.service";

const schema = z.object({
  name:          z.string().min(2, "Name required"),
  phone:         z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit phone required"),
  email:         z.string().email("Valid email required").optional().or(z.literal("")),
  occupation:    z.string().optional().or(z.literal("")),
  monthlyRent:   z.string().min(1, "Rent required"),
  depositAmount: z.string().min(1, "Deposit required"),
  moveInDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  emergencyName: z.string().optional().or(z.literal("")),
  emergencyPhone:z.string().optional().or(z.literal("")),
  emergencyRel:  z.string().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const GENDERS = ["male", "female", "other"] as const;
type Gender = typeof GENDERS[number];

function PickerModal({
  visible, title, items, selected, onSelect, onClose, keyField, labelField,
}: {
  visible: boolean; title: string; items: any[]; selected: string;
  onSelect: (item: any) => void; onClose: () => void;
  keyField: string; labelField: string;
}) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="bg-white rounded-t-3xl" style={{ paddingBottom: bottom + 16, maxHeight: "60%" }}>
        <View className="w-10 h-1 bg-slate-200 rounded-full self-center mt-4 mb-3" />
        <Text className="text-base font-bold text-slate-800 px-5 mb-3">{title}</Text>
        <FlatList
          data={items}
          keyExtractor={(i) => i[keyField]}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { onSelect(item); onClose(); }}
              className="flex-row items-center px-5 py-3.5 border-b border-slate-50"
            >
              <Text className="flex-1 text-sm text-slate-700">{item[labelField]}</Text>
              {selected === item[keyField] && <Check size={16} color="#2563EB" />}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

export default function AddResidentScreen() {
  const { top } = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { buildings } = useBuildings();

  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedRoomId, setSelectedRoomId]         = useState("");
  const [selectedBedId, setSelectedBedId]           = useState("");
  const [availableBeds, setAvailableBeds]           = useState<any[]>([]);
  const [gender, setGender]                         = useState<Gender | "">("");
  const [loading, setLoading]                       = useState(false);
  const [showBuildingPicker, setShowBuildingPicker] = useState(false);
  const [showRoomPicker, setShowRoomPicker]         = useState(false);
  const [showBedPicker, setShowBedPicker]           = useState(false);

  const { rooms } = useRooms(selectedBuildingId);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const selectedRoom     = rooms.find((r) => r.id === selectedRoomId);
  const selectedBed      = availableBeds.find((b) => b.id === selectedBedId);

  async function onRoomSelect(room: any) {
    setSelectedRoomId(room.id);
    setSelectedBedId("");
    const { data } = await buildingService.getAvailableBeds(room.id);
    setAvailableBeds(data ?? []);
  }

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { moveInDate: new Date().toISOString().split("T")[0] },
  });

  async function onSubmit(data: FormData) {
    if (!session?.user?.id) return;
    if (!selectedBuildingId) { Alert.alert("Error", "Please select a building."); return; }
    if (!selectedRoomId)     { Alert.alert("Error", "Please select a room."); return; }
    if (!selectedBedId)      { Alert.alert("Error", "Please select a bed."); return; }

    try {
      setLoading(true);
      const { error } = await residentService.create({
        owner_id:                   session.user.id,
        name:                       data.name,
        phone:                      data.phone,
        email:                      data.email || null,
        occupation:                 data.occupation || null,
        gender:                     gender || null,
        date_of_birth:              null,
        building_id:                selectedBuildingId,
        floor_id:                   selectedRoom?.floor_id ?? null,
        room_id:                    selectedRoomId,
        bed_id:                     selectedBedId || null,
        move_in_date:               data.moveInDate,
        move_out_date:              null,
        monthly_rent:               parseFloat(data.monthlyRent),
        deposit_amount:             parseFloat(data.depositAmount),
        kyc_status:                 "pending",
        status:                     "active",
        avatar_url:                 null,
        emergency_contact_name:     data.emergencyName || null,
        emergency_contact_phone:    data.emergencyPhone || null,
        emergency_contact_relation: data.emergencyRel || null,
      });
      if (error) throw error;
      Alert.alert("Success", "Resident added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to add resident.");
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
          <Text className="text-lg font-bold text-slate-800 flex-1">Add Resident</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Personal Info */}
        <Card>
          <Text className="font-bold text-slate-800 mb-4">Personal Info</Text>
          <Controller control={control} name="name"
            render={({ field: { onChange, value } }) => (
              <Input label="Full Name *" placeholder="Amit Kumar"
                onChangeText={onChange} value={value} error={errors.name?.message} />
            )}
          />
          <Controller control={control} name="phone"
            render={({ field: { onChange, value } }) => (
              <Input label="Phone *" placeholder="9876543210" keyboardType="phone-pad"
                onChangeText={onChange} value={value} error={errors.phone?.message} />
            )}
          />
          <Controller control={control} name="email"
            render={({ field: { onChange, value } }) => (
              <Input label="Email" placeholder="amit@example.com" keyboardType="email-address"
                autoCapitalize="none" onChangeText={onChange} value={value ?? ""} error={errors.email?.message} />
            )}
          />
          <Controller control={control} name="occupation"
            render={({ field: { onChange, value } }) => (
              <Input label="Occupation" placeholder="Software Engineer"
                onChangeText={onChange} value={value ?? ""} />
            )}
          />

          {/* Gender */}
          <Text className="text-sm font-medium text-slate-700 mb-1.5">Gender</Text>
          <View className="flex-row gap-2 mb-2">
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                className={`flex-1 py-2.5 rounded-xl border items-center ${
                  gender === g ? "bg-blue-600 border-blue-600" : "bg-slate-50 border-slate-200"
                }`}
              >
                <Text className={`text-sm font-medium capitalize ${gender === g ? "text-white" : "text-slate-600"}`}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Room Assignment */}
        <Card>
          <Text className="font-bold text-slate-800 mb-4">Room Assignment</Text>

          {/* Building picker */}
          <Text className="text-sm font-medium text-slate-700 mb-1.5">Building *</Text>
          <TouchableOpacity
            onPress={() => setShowBuildingPicker(true)}
            className="flex-row items-center border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 mb-4"
          >
            <Text className={`flex-1 text-sm ${selectedBuilding ? "text-slate-800" : "text-slate-400"}`}>
              {selectedBuilding?.name ?? "Select a building"}
            </Text>
            <ChevronDown size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Room picker */}
          <Text className="text-sm font-medium text-slate-700 mb-1.5">Room *</Text>
          <TouchableOpacity
            onPress={() => {
              if (!selectedBuildingId) { Alert.alert("", "Please select a building first."); return; }
              setShowRoomPicker(true);
            }}
            className="flex-row items-center border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 mb-4"
            style={{ opacity: selectedBuildingId ? 1 : 0.5 }}
          >
            <Text className={`flex-1 text-sm ${selectedRoom ? "text-slate-800" : "text-slate-400"}`}>
              {selectedRoom ? `Room ${selectedRoom.room_number} (${selectedRoom.type})` : "Select a room"}
            </Text>
            <ChevronDown size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Bed picker */}
          <Text className="text-sm font-medium text-slate-700 mb-1.5">Bed *</Text>
          <TouchableOpacity
            onPress={() => {
              if (!selectedRoomId) { Alert.alert("", "Please select a room first."); return; }
              if (availableBeds.length === 0) { Alert.alert("", "No available beds in this room."); return; }
              setShowBedPicker(true);
            }}
            className="flex-row items-center border border-slate-200 rounded-xl px-4 py-3 bg-slate-50"
            style={{ opacity: selectedRoomId ? 1 : 0.5 }}
          >
            <Text className={`flex-1 text-sm ${selectedBed ? "text-slate-800" : "text-slate-400"}`}>
              {selectedBed ? selectedBed.bed_number : availableBeds.length === 0 && selectedRoomId ? "No beds available" : "Select a bed"}
            </Text>
            <ChevronDown size={16} color="#94A3B8" />
          </TouchableOpacity>
        </Card>

        {/* Payment */}
        <Card>
          <Text className="font-bold text-slate-800 mb-4">Payment</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller control={control} name="monthlyRent"
                render={({ field: { onChange, value } }) => (
                  <Input label="Monthly Rent ₹ *" placeholder="8000" keyboardType="numeric"
                    onChangeText={onChange} value={value} error={errors.monthlyRent?.message} />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller control={control} name="depositAmount"
                render={({ field: { onChange, value } }) => (
                  <Input label="Deposit ₹ *" placeholder="16000" keyboardType="numeric"
                    onChangeText={onChange} value={value} error={errors.depositAmount?.message} />
                )}
              />
            </View>
          </View>
          <Controller control={control} name="moveInDate"
            render={({ field: { onChange, value } }) => (
              <Input label="Move-in Date *" placeholder="YYYY-MM-DD"
                onChangeText={onChange} value={value} error={errors.moveInDate?.message} />
            )}
          />
        </Card>

        {/* Emergency Contact */}
        <Card>
          <Text className="font-bold text-slate-800 mb-4">Emergency Contact</Text>
          <Controller control={control} name="emergencyName"
            render={({ field: { onChange, value } }) => (
              <Input label="Name" placeholder="Parent/Guardian name"
                onChangeText={onChange} value={value ?? ""} />
            )}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller control={control} name="emergencyPhone"
                render={({ field: { onChange, value } }) => (
                  <Input label="Phone" placeholder="9876543210" keyboardType="phone-pad"
                    onChangeText={onChange} value={value ?? ""} />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller control={control} name="emergencyRel"
                render={({ field: { onChange, value } }) => (
                  <Input label="Relation" placeholder="Father"
                    onChangeText={onChange} value={value ?? ""} />
                )}
              />
            </View>
          </View>
        </Card>

        <Button label="Add Resident" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />
        <View className="h-8" />
      </ScrollView>

      {/* Building Picker Modal */}
      <PickerModal
        visible={showBuildingPicker}
        title="Select Building"
        items={buildings}
        selected={selectedBuildingId}
        keyField="id"
        labelField="name"
        onSelect={(b) => { setSelectedBuildingId(b.id); setSelectedRoomId(""); }}
        onClose={() => setShowBuildingPicker(false)}
      />

      {/* Room Picker Modal */}
      <PickerModal
        visible={showRoomPicker}
        title="Select Room"
        items={rooms.map((r) => ({ ...r, label: `Room ${r.room_number} — ${r.type} — ₹${r.monthly_rent}/mo` }))}
        selected={selectedRoomId}
        keyField="id"
        labelField="label"
        onSelect={(r) => onRoomSelect(r)}
        onClose={() => setShowRoomPicker(false)}
      />

      {/* Bed Picker Modal */}
      <PickerModal
        visible={showBedPicker}
        title="Select Available Bed"
        items={availableBeds}
        selected={selectedBedId}
        keyField="id"
        labelField="bed_number"
        onSelect={(b) => setSelectedBedId(b.id)}
        onClose={() => setShowBedPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}
