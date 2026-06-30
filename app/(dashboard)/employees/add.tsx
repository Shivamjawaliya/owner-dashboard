import {
  View, Text, ScrollView, TouchableOpacity, Image,
  KeyboardAvoidingView, Platform, Alert, Modal, Pressable, FlatList, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useBuildings } from "@/hooks/useBuildings";
import { useAuthStore } from "@/store/auth.store";
import { employeeService } from "@/services/employee.service";
import { uploadImage } from "@/utils/uploadImage";
import { getInitials } from "@/utils/format";

const ROLES = ["manager", "security", "cleaner", "electrician", "plumber", "cook", "other"] as const;
type Role = typeof ROLES[number];

const ROLE_COLORS: Record<Role, string> = {
  manager: "#2563EB", security: "#8B5CF6", cleaner: "#22C55E",
  electrician: "#F59E0B", plumber: "#EF4444", cook: "#EC4899", other: "#94A3B8",
};

const schema = z.object({
  name:        z.string().min(2, "Name required"),
  phone:       z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit phone required"),
  email:       z.string().email("Valid email required").optional().or(z.literal("")),
  salary:      z.string().min(1, "Salary required"),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
});
type FormData = z.infer<typeof schema>;

export default function AddEmployeeScreen() {
  const { top } = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { buildings } = useBuildings();

  const [role, setRole]                           = useState<Role>("other");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [showBuildingPicker, setShowBuildingPicker] = useState(false);
  const [avatarUri, setAvatarUri]                 = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading]     = useState(false);
  const [loading, setLoading]                     = useState(false);

  const { bottom } = useSafeAreaInsets();

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { joiningDate: new Date().toISOString().split("T")[0] },
  });

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
  }

  async function onSubmit(data: FormData) {
    if (!session?.user?.id) return;
    try {
      setLoading(true);

      // Upload avatar if selected
      let avatarUrl: string | null = null;
      if (avatarUri) {
        setAvatarUploading(true);
        avatarUrl = await uploadImage(`employees/${session.user.id}`, avatarUri);
        setAvatarUploading(false);
      }

      const { error } = await employeeService.create({
        owner_id:    session.user.id,
        name:        data.name,
        phone:       data.phone,
        email:       data.email || null,
        role,
        salary:      parseFloat(data.salary),
        joining_date: data.joiningDate,
        building_id: selectedBuildingId || null,
        avatar_url:  avatarUrl,
        status:      "active",
      });
      if (error) throw error;
      Alert.alert("Success", "Employee added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to add employee.");
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
          <Text className="text-lg font-bold text-slate-800 flex-1">Add Employee</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Picker */}
        <View className="items-center py-2">
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85}>
            <View
              className="w-24 h-24 rounded-full bg-slate-200 items-center justify-center overflow-hidden border-4 border-white"
              style={{ shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, elevation: 5 }}
            >
              {avatarUploading ? (
                <ActivityIndicator color="#2563EB" />
              ) : avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96 }} resizeMode="cover" />
              ) : (
                <Camera size={28} color="#94A3B8" />
              )}
            </View>
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 items-center justify-center border-2 border-white">
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text className="text-sm text-slate-400 mt-2">Tap to add photo</Text>
        </View>

        {/* Personal Info */}
        <Card>
          <Text className="font-bold text-slate-800 mb-4">Personal Info</Text>
          <Controller control={control} name="name"
            render={({ field: { onChange, value } }) => (
              <Input label="Full Name *" placeholder="Ramesh Kumar"
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
              <Input label="Email" placeholder="ramesh@example.com" keyboardType="email-address"
                autoCapitalize="none" onChangeText={onChange} value={value ?? ""} error={errors.email?.message} />
            )}
          />
        </Card>

        {/* Role */}
        <Card>
          <Text className="font-bold text-slate-800 mb-3">Role *</Text>
          <View className="flex-row flex-wrap gap-2">
            {ROLES.map((r) => {
              const active = role === r;
              const color  = ROLE_COLORS[r];
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r)}
                  className={`px-3 py-2 rounded-xl border ${active ? "border-transparent" : "border-slate-200 bg-slate-50"}`}
                  style={active ? { backgroundColor: color + "20", borderColor: color } : {}}
                >
                  <Text
                    className={`text-sm font-semibold capitalize ${active ? "" : "text-slate-500"}`}
                    style={active ? { color } : {}}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Job Details */}
        <Card>
          <Text className="font-bold text-slate-800 mb-4">Job Details</Text>

          <Controller control={control} name="salary"
            render={({ field: { onChange, value } }) => (
              <Input label="Monthly Salary ₹ *" placeholder="15000" keyboardType="numeric"
                onChangeText={onChange} value={value} error={errors.salary?.message} />
            )}
          />
          <Controller control={control} name="joiningDate"
            render={({ field: { onChange, value } }) => (
              <Input label="Joining Date *" placeholder="YYYY-MM-DD"
                onChangeText={onChange} value={value} error={errors.joiningDate?.message} />
            )}
          />

          {/* Building assignment */}
          <Text className="text-sm font-medium text-slate-700 mb-1.5">Assigned Building (optional)</Text>
          <TouchableOpacity
            onPress={() => setShowBuildingPicker(true)}
            className="flex-row items-center border border-slate-200 rounded-xl px-4 py-3 bg-slate-50"
          >
            <Text className={`flex-1 text-sm ${selectedBuilding ? "text-slate-800" : "text-slate-400"}`}>
              {selectedBuilding?.name ?? "All Buildings (no specific assignment)"}
            </Text>
            {selectedBuilding && (
              <TouchableOpacity onPress={() => setSelectedBuildingId("")}>
                <Text className="text-xs text-red-400 ml-2">Clear</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </Card>

        <Button label="Add Employee" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />
        <View className="h-8" />
      </ScrollView>

      {/* Building Picker Modal */}
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
                onPress={() => { setSelectedBuildingId(item.id); setShowBuildingPicker(false); }}
                className="flex-row items-center px-5 py-3.5 border-b border-slate-50"
              >
                <Text className="flex-1 text-sm text-slate-700">{item.name}</Text>
                {selectedBuildingId === item.id && <Check size={16} color="#2563EB" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
