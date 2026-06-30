import { View, ActivityIndicator, Text } from "react-native";

export default function AuthCallbackScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 16 }}>Signing you in…</Text>
    </View>
  );
}
