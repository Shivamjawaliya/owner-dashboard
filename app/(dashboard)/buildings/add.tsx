import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Linking, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, MapPin, ExternalLink, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "@/components/ui/Input";
import SuggestInput from "@/components/ui/SuggestInput";
import PhotoPicker from "@/components/ui/PhotoPicker";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LocationPicker, { LocationResult } from "@/components/ui/LocationPicker";
import { AMENITIES } from "@/constants";
import { INDIAN_STATES, CITIES_BY_STATE, ALL_CITIES } from "@/constants/india";
import { buildingService } from "@/services/building.service";
import { useAuthStore } from "@/store/auth.store";
import { uploadImage } from "@/utils/uploadImage";

const schema = z.object({
  name:        z.string().min(2, "Building name required"),
  line1:       z.string().min(3, "Address required"),
  city:        z.string().min(2, "City required"),
  state:       z.string().min(2, "State required"),
  pincode:     z.string().regex(/^\d{6}$/, "Enter valid 6-digit pincode"),
  totalFloors: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

export default function AddBuildingScreen() {
  const { top } = useSafeAreaInsets();
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [fillingAddress, setFillingAddress] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function toggleAmenity(a: string) {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  async function handleLocationConfirm(result: LocationResult) {
    setLocation(result);
    // Reverse geocode to auto-fill address fields
    setFillingAddress(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${result.latitude}&lon=${result.longitude}&format=json`;
      const res = await fetch(url, { headers: { "User-Agent": "HomiePGOwner/1.0" } });
      const json = await res.json();
      const addr = json.address ?? {};

      const road      = addr.road ?? addr.pedestrian ?? addr.footway ?? "";
      const suburb    = addr.suburb ?? addr.neighbourhood ?? addr.quarter ?? "";
      const line1     = [road, suburb].filter(Boolean).join(", ");
      const city      = addr.city ?? addr.town ?? addr.village ?? addr.county ?? "";
      const state     = addr.state ?? "";
      const pincode   = addr.postcode ?? "";

      if (line1)  setValue("line1", line1,   { shouldValidate: true });
      if (city)   { setValue("city", city,   { shouldValidate: true }); }
      if (state)  { setValue("state", state, { shouldValidate: true }); setSelectedState(state); }
      if (pincode && /^\d{6}$/.test(pincode)) setValue("pincode", pincode, { shouldValidate: true });
    } catch {
      // Silently fail — address fields stay empty for manual entry
    } finally {
      setFillingAddress(false);
    }
  }

  async function onSubmit(data: FormData) {
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to add a building.");
      return;
    }
    try {
      setLoading(true);
      const uploadedUrls: string[] = [];
      for (const uri of photoUris) {
        const url = await uploadImage(`buildings/${session.user.id}`, uri);
        if (url) uploadedUrls.push(url);
      }
      const { error } = await buildingService.create({
        owner_id:      session.user.id,
        name:          data.name,
        address_line1: data.line1,
        address_line2: null,
        city:          data.city,
        state:         data.state,
        pincode:       data.pincode,
        total_floors:  parseInt(data.totalFloors, 10),
        amenities:     selectedAmenities,
        images:        uploadedUrls,
        status:        "active",
        latitude:      location?.latitude ?? null,
        longitude:     location?.longitude ?? null,
        maps_url:      location?.maps_url ?? null,
      } as any);
      if (error) throw error;
      Alert.alert("Success", "Building added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to add building.");
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
          <Text className="text-lg font-bold text-slate-800 flex-1">Add New Building</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">

        {/* Basic Info */}
        <Card>
          <View className="flex-row items-center mb-4">
            <Building2 size={20} color="#2563EB" />
            <Text className="ml-2 font-bold text-slate-800">Basic Info</Text>
          </View>
          <Controller control={control} name="name"
            render={({ field: { onChange, value } }) => (
              <Input label="Building Name *" placeholder="e.g. Sunrise PG"
                onChangeText={onChange} value={value} error={errors.name?.message} />
            )}
          />
          <Controller control={control} name="totalFloors"
            render={({ field: { onChange, value } }) => (
              <Input label="Total Floors *" placeholder="e.g. 4" keyboardType="numeric"
                onChangeText={onChange} value={value} error={errors.totalFloors?.message} />
            )}
          />
        </Card>

        {/* Location — BEFORE address */}
        <Card>
          <Text className="font-bold text-slate-800 mb-3">Location</Text>
          {location ? (
            <View>
              <View className="flex-row items-center bg-green-50 border border-green-200 rounded-xl px-3 py-3 mb-2">
                <MapPin size={16} color="#16A34A" />
                <Text className="flex-1 text-sm text-green-700 ml-2 font-medium">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </Text>
                {fillingAddress
                  ? <ActivityIndicator size="small" color="#16A34A" />
                  : <TouchableOpacity onPress={() => setLocation(null)}>
                      <X size={16} color="#94A3B8" />
                    </TouchableOpacity>
                }
              </View>
              {fillingAddress && (
                <Text className="text-xs text-slate-400 text-center mb-2">Filling address from map…</Text>
              )}
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => Linking.openURL(location.maps_url)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2.5"
                >
                  <ExternalLink size={14} color="#2563EB" />
                  <Text className="text-sm text-blue-600 font-medium">Open in Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowMapPicker(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2.5"
                >
                  <MapPin size={14} color="#64748B" />
                  <Text className="text-sm text-slate-600 font-medium">Change Pin</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowMapPicker(true)}
              className="flex-row items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-5"
            >
              <MapPin size={20} color="#2563EB" />
              <Text className="text-blue-600 font-semibold text-sm">Pick Location on Map</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Address — auto-filled from map, editable */}
        <Card>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-bold text-slate-800">Address</Text>
            {fillingAddress && <ActivityIndicator size="small" color="#2563EB" />}
          </View>
          <Controller control={control} name="line1"
            render={({ field: { onChange, value } }) => (
              <Input label="Street Address *" placeholder="123, MG Road"
                onChangeText={onChange} value={value ?? ""} error={errors.line1?.message} />
            )}
          />
          <Controller control={control} name="state"
            render={({ field: { onChange, value } }) => (
              <SuggestInput
                label="State *"
                placeholder="e.g. Madhya Pradesh"
                value={value ?? ""}
                suggestions={INDIAN_STATES}
                onChangeText={(t) => { onChange(t); setSelectedState(t); }}
                onSelect={(s) => { onChange(s); setSelectedState(s); }}
                error={errors.state?.message}
              />
            )}
          />
          <Controller control={control} name="city"
            render={({ field: { onChange, value } }) => {
              const stateCities = CITIES_BY_STATE[selectedState] ?? [];
              const citySuggestions = stateCities.length > 0
                ? [...stateCities, ...ALL_CITIES.filter((c) => !stateCities.includes(c))]
                : ALL_CITIES;
              return (
                <SuggestInput
                  label="City *"
                  placeholder="e.g. Bhopal"
                  value={value ?? ""}
                  suggestions={citySuggestions}
                  onChangeText={onChange}
                  onSelect={onChange}
                  error={errors.city?.message}
                />
              );
            }}
          />
          <Controller control={control} name="pincode"
            render={({ field: { onChange, value } }) => (
              <Input label="Pincode *" placeholder="462001" keyboardType="numeric"
                onChangeText={onChange} value={value ?? ""} error={errors.pincode?.message} />
            )}
          />
        </Card>

        {/* Amenities */}
        <Card>
          <Text className="font-bold text-slate-800 mb-3">Amenities</Text>
          <View className="flex-row flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const selected = selectedAmenities.includes(a);
              return (
                <TouchableOpacity
                  key={a}
                  onPress={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full border ${
                    selected ? "bg-blue-600 border-blue-600" : "bg-white border-slate-200"
                  }`}
                >
                  <Text className={`text-sm font-medium ${selected ? "text-white" : "text-slate-600"}`}>
                    {a}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Photos */}
        <Card>
          <Text className="font-bold text-slate-800 mb-3">Property Photos</Text>
          <PhotoPicker
            photos={photoUris}
            onPhotosChange={setPhotoUris}
            maxPhotos={8}
            label="Add up to 8 photos"
          />
        </Card>

        <Button
          label={loading ? (photoUris.length > 0 ? "Uploading photos…" : "Saving…") : "Save Building"}
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          fullWidth
          size="lg"
        />
        <View className="h-8" />
      </ScrollView>

      <LocationPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={handleLocationConfirm}
        initial={location}
      />
    </KeyboardAvoidingView>
  );
}
