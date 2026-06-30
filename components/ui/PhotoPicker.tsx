import {
  View, Text, Image, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, Platform,
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, X } from "lucide-react-native";

interface Props {
  photos: string[];           // local URIs or remote URLs already selected
  onPhotosChange: (uris: string[]) => void;
  maxPhotos?: number;
  label?: string;
}

export default function PhotoPicker({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  label = "Photos",
}: Props) {
  const [loading, setLoading] = useState(false);

  async function requestPermission(type: "camera" | "library") {
    if (type === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === "granted";
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === "granted";
    }
  }

  async function pickFromLibrary() {
    const granted = await requestPermission("library");
    if (!granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library in Settings.");
      return;
    }
    setLoading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: maxPhotos - photos.length,
      quality: 0.8,
    });
    setLoading(false);
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      onPhotosChange([...photos, ...newUris].slice(0, maxPhotos));
    }
  }

  async function pickFromCamera() {
    const granted = await requestPermission("camera");
    if (!granted) {
      Alert.alert("Permission Required", "Please allow camera access in Settings.");
      return;
    }
    setLoading(true);
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    setLoading(false);
    if (!result.canceled && result.assets[0]) {
      onPhotosChange([...photos, result.assets[0].uri].slice(0, maxPhotos));
    }
  }

  function showOptions() {
    if (photos.length >= maxPhotos) {
      Alert.alert("Limit reached", `You can add up to ${maxPhotos} photos.`);
      return;
    }
    Alert.alert("Add Photo", "Choose source", [
      { text: "Camera",       onPress: pickFromCamera },
      { text: "Photo Library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function removePhoto(index: number) {
    onPhotosChange(photos.filter((_, i) => i !== index));
  }

  return (
    <View className="mb-3">
      <Text className="text-sm font-medium text-slate-700 mb-2">{label}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {photos.map((uri, index) => (
          <View key={index} className="relative">
            <Image
              source={{ uri }}
              className="rounded-2xl"
              style={{ width: 90, height: 90 }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => removePhoto(index)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
              style={{ elevation: 4 }}
            >
              <X size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < maxPhotos && (
          <TouchableOpacity
            onPress={showOptions}
            disabled={loading}
            className="w-[90px] h-[90px] rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 items-center justify-center gap-1"
          >
            {loading ? (
              <ActivityIndicator color="#2563EB" size="small" />
            ) : (
              <>
                <ImagePlus size={22} color="#94A3B8" />
                <Text className="text-xs text-slate-400 font-medium">Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {photos.length > 0 && (
        <Text className="text-xs text-slate-400 mt-1.5">
          {photos.length}/{maxPhotos} photos · tap × to remove
        </Text>
      )}
    </View>
  );
}
