import {
  View, Text, Modal, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, TextInput, Keyboard, FlatList,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";
import { MapPin, Navigation, X, Check, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface LocationResult {
  latitude: number;
  longitude: number;
  maps_url: string;
}

interface Suggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: LocationResult) => void;
  initial?: { latitude: number; longitude: number } | null;
}

const DEFAULT_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

export default function LocationPicker({ visible, onClose, onConfirm, initial }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [region, setRegion] = useState<Region>(
    initial
      ? { ...initial, latitudeDelta: 0.01, longitudeDelta: 0.01 }
      : DEFAULT_REGION
  );
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  async function fetchSuggestions(q: string) {
    setLoadingSuggestions(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in`;
      const res = await fetch(url, { headers: { "User-Agent": "HomiePGOwner/1.0" } });
      const json: Suggestion[] = await res.json();
      setSuggestions(json);
      setShowSuggestions(json.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  function selectSuggestion(item: Suggestion) {
    Keyboard.dismiss();
    setSearchQuery(item.display_name.split(",")[0]);
    setSuggestions([]);
    setShowSuggestions(false);
    const newRegion: Region = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 800);
  }

  async function useCurrentLocation() {
    setLocating(true);
    setShowSuggestions(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Allow location access to use this feature.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newRegion: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 600);
    } catch {
      Alert.alert("Error", "Could not get your location. Try again.");
    } finally {
      setLocating(false);
    }
  }

  function handleConfirm() {
    const { latitude, longitude } = region;
    onConfirm({
      latitude,
      longitude,
      maps_url: `https://maps.google.com/?q=${latitude},${longitude}`,
    });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          className="bg-white border-b border-slate-100 px-4 pb-3 flex-row items-center"
          style={{ paddingTop: top + 8 }}
        >
          <TouchableOpacity onPress={onClose} className="mr-3 p-1">
            <X size={22} color="#1E293B" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-800">Pin Building Location</Text>
            <Text className="text-xs text-slate-400">Search or drag map to position the pin</Text>
          </View>
          <TouchableOpacity
            onPress={handleConfirm}
            className="flex-row items-center bg-blue-600 px-4 py-2 rounded-xl gap-1.5"
          >
            <Check size={15} color="#fff" />
            <Text className="text-white text-sm font-semibold">Confirm</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation
            showsMyLocationButton={false}
            onPress={() => setShowSuggestions(false)}
          />

          {/* Search bar + suggestions */}
          <View style={[styles.searchContainer, { top: 12 }]}>
            <View style={styles.searchBar}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search city or area…"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                returnKeyType="search"
                autoCorrect={false}
              />
              {loadingSuggestions ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {suggestions.map((item, idx) => {
                  const parts = item.display_name.split(", ");
                  const main = parts[0];
                  const sub = parts.slice(1, 3).join(", ");
                  return (
                    <TouchableOpacity
                      key={item.place_id}
                      onPress={() => selectSuggestion(item)}
                      style={[
                        styles.suggestionItem,
                        idx < suggestions.length - 1 && styles.suggestionBorder,
                      ]}
                    >
                      <MapPin size={14} color="#2563EB" style={{ marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggestionMain} numberOfLines={1}>{main}</Text>
                        {sub ? <Text style={styles.suggestionSub} numberOfLines={1}>{sub}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Fixed center pin */}
          <View style={styles.pinContainer} pointerEvents="none">
            <MapPin size={40} color="#2563EB" fill="#2563EB" />
            <View style={styles.pinShadow} />
          </View>

          {/* Coordinates badge */}
          <View style={styles.coordsBadge}>
            <Text style={styles.coordsText}>
              {region.latitude.toFixed(5)}, {region.longitude.toFixed(5)}
            </Text>
          </View>

          {/* Current location button */}
          <TouchableOpacity
            onPress={useCurrentLocation}
            style={[styles.myLocationBtn, { bottom: bottom + 24 }]}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <>
                <Navigation size={18} color="#2563EB" />
                <Text style={styles.myLocationText}>My Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: "absolute",
    left: 12,
    right: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    paddingVertical: 0,
  },
  suggestionsBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  suggestionMain: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  suggestionSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  pinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -44,
    alignItems: "center",
  },
  pinShadow: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.25)",
    marginTop: 2,
  },
  coordsBadge: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  coordsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  myLocationBtn: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  myLocationText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },
});
