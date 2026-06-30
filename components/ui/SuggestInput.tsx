import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";

interface Props {
  label: string;
  placeholder?: string;
  value: string;
  suggestions: string[];
  onChangeText: (text: string) => void;
  onSelect?: (value: string) => void;
  error?: string;
  maxSuggestions?: number;
}

export default function SuggestInput({
  label, placeholder, value, suggestions, onChangeText, onSelect, error, maxSuggestions = 6,
}: Props) {
  const [showList, setShowList] = useState(false);

  const filtered = value.length >= 1
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, maxSuggestions)
    : [];

  const showDropdown = showList && filtered.length > 0;

  function handleSelect(item: string) {
    onChangeText(item);
    onSelect?.(item);
    setShowList(false);
  }

  return (
    <View className="mb-3" style={{ zIndex: 10 }}>
      <Text className="text-sm font-medium text-slate-700 mb-1.5">{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        onChangeText={(t) => { onChangeText(t); setShowList(true); }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        className={`border rounded-xl px-4 py-3 text-sm text-slate-800 bg-white ${
          error ? "border-red-400" : showDropdown ? "border-blue-400" : "border-slate-200"
        }`}
      />
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}

      {showDropdown && (
        <View
          className="bg-white border border-slate-200 rounded-xl mt-1 overflow-hidden"
          style={{ maxHeight: 200, elevation: 8, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
        >
          <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
            {filtered.map((item, i) => (
              <TouchableOpacity
                key={item}
                onPress={() => handleSelect(item)}
                className={`px-4 py-3 ${i < filtered.length - 1 ? "border-b border-slate-50" : ""}`}
              >
                <Text className="text-sm text-slate-700">{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
