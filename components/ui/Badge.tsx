import { View, Text } from "react-native";

type Variant = "success" | "warning" | "danger" | "primary" | "neutral";

const styles: Record<Variant, { bg: string; text: string }> = {
  success: { bg: "bg-green-100", text: "text-green-700" },
  warning: { bg: "bg-yellow-100", text: "text-yellow-700" },
  danger:  { bg: "bg-red-100",   text: "text-red-700" },
  primary: { bg: "bg-blue-100",  text: "text-blue-700" },
  neutral: { bg: "bg-slate-100", text: "text-slate-600" },
};

interface Props {
  label: string;
  variant?: Variant;
}

export default function Badge({ label, variant = "neutral" }: Props) {
  const { bg, text } = styles[variant];
  return (
    <View className={`px-2 py-0.5 rounded-full ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
