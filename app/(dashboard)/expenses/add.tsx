import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Modal, Pressable, FlatList, TextInput,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, Check, Zap, Droplets, Wifi, Users, Wrench, MoreHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useBuildings } from "@/hooks/useBuildings";
import { useAuthStore } from "@/store/auth.store";
import { expenseService } from "@/services/expense.service";

const CATEGORIES = ["electricity", "water", "internet", "salary", "maintenance", "other"] as const;
type Category = typeof CATEGORIES[number];

const CAT_ICONS: Record<Category, React.ElementType> = {
  electricity: Zap, water: Droplets, internet: Wifi,
  salary: Users, maintenance: Wrench, other: MoreHorizontal,
};
const CAT_COLORS: Record<Category, string> = {
  electricity: "#F59E0B", water: "#3B82F6", internet: "#8B5CF6",
  salary: "#22C55E", maintenance: "#EF4444", other: "#94A3B8",
};

export default function AddExpenseScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { session }     = useAuthStore();
  const { buildings }   = useBuildings();

  const [title, setTitle]                         = useState("");
  const [amount, setAmount]                       = useState("");
  const [notes, setNotes]                         = useState("");
  const [category, setCategory]                   = useState<Category>("other");
  const [date, setDate]                           = useState(new Date().toISOString().split("T")[0]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [showBuildingPicker, setShowBuildingPicker] = useState(false);
  const [loading, setLoading]                     = useState(false);
  const [errors, setErrors]                       = useState<Record<string, string>>({});

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim())          e.title    = "Title is required";
    if (!amount || isNaN(parseFloat(amount))) e.amount = "Valid amount required";
    if (!selectedBuildingId)    e.building = "Please select a building";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) e.date   = "Use YYYY-MM-DD format";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const { error } = await expenseService.create({
        owner_id:    session.user.id,
        building_id: selectedBuildingId,
        title:       title.trim(),
        amount:      parseFloat(amount),
        category,
        date,
        notes:       notes.trim() || null,
        receipt_url: null,
      });
      if (error) throw error;
      Alert.alert("Success", "Expense recorded!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to add expense.");
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
          <Text className="text-lg font-bold text-slate-800 flex-1">Add Expense</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Details */}
        <Card>
          <Text className="font-bold text-slate-800 mb-4">Expense Details</Text>

          <Text className="text-sm font-medium text-slate-700 mb-1.5">Title *</Text>
          <TextInput
            value={title}
            onChangeText={(t) => { setTitle(t); setErrors((p) => ({ ...p, title: "" })); }}
            placeholder="e.g. Electricity bill - June"
            placeholderTextColor="#94A3B8"
            className={`border rounded-xl px-4 py-3 text-sm text-slate-800 bg-white mb-1 ${errors.title ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.title ? <Text className="text-xs text-red-500 mb-2">{errors.title}</Text> : null}

          <Text className="text-sm font-medium text-slate-700 mb-1.5 mt-2">Amount ₹ *</Text>
          <TextInput
            value={amount}
            onChangeText={(t) => { setAmount(t); setErrors((p) => ({ ...p, amount: "" })); }}
            placeholder="5000"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            className={`border rounded-xl px-4 py-3 text-sm text-slate-800 bg-white mb-1 ${errors.amount ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.amount ? <Text className="text-xs text-red-500 mb-2">{errors.amount}</Text> : null}

          <Text className="text-sm font-medium text-slate-700 mb-1.5 mt-2">Date *</Text>
          <TextInput
            value={date}
            onChangeText={(t) => { setDate(t); setErrors((p) => ({ ...p, date: "" })); }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            className={`border rounded-xl px-4 py-3 text-sm text-slate-800 bg-white mb-1 ${errors.date ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.date ? <Text className="text-xs text-red-500 mb-2">{errors.date}</Text> : null}

          <Text className="text-sm font-medium text-slate-700 mb-1.5 mt-2">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white"
            style={{ minHeight: 72 }}
          />
        </Card>

        {/* Category */}
        <Card>
          <Text className="font-bold text-slate-800 mb-3">Category *</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active  = category === c;
              const color   = CAT_COLORS[c];
              const Icon    = CAT_ICONS[c];
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`flex-row items-center gap-1.5 px-3 py-2.5 rounded-xl border ${
                    active ? "border-transparent" : "bg-slate-50 border-slate-200"
                  }`}
                  style={active ? { backgroundColor: color + "18", borderColor: color } : {}}
                >
                  <Icon size={14} color={active ? color : "#94A3B8"} />
                  <Text
                    className={`text-sm font-medium capitalize ${active ? "" : "text-slate-500"}`}
                    style={active ? { color } : {}}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Building */}
        <Card>
          <Text className="font-bold text-slate-800 mb-3">Building *</Text>
          <TouchableOpacity
            onPress={() => setShowBuildingPicker(true)}
            className={`flex-row items-center border rounded-xl px-4 py-3 bg-slate-50 ${errors.building ? "border-red-400" : "border-slate-200"}`}
          >
            <Text className={`flex-1 text-sm ${selectedBuilding ? "text-slate-800" : "text-slate-400"}`}>
              {selectedBuilding?.name ?? "Select building..."}
            </Text>
          </TouchableOpacity>
          {errors.building ? <Text className="text-xs text-red-500 mt-1">{errors.building}</Text> : null}
        </Card>

        <Button label="Save Expense" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
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
                onPress={() => { setSelectedBuildingId(item.id); setShowBuildingPicker(false); setErrors((p) => ({ ...p, building: "" })); }}
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
