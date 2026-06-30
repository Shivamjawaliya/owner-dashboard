import { View, Text } from "react-native";
import Card from "@/components/ui/Card";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  accentColor?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend, accentColor = "#2563EB" }: Props) {
  return (
    <Card className="flex-1 min-w-[150px]">
      <View className="flex-row items-start justify-between mb-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: accentColor + "18" }}
        >
          {icon}
        </View>
        {trend && (
          <View
            className={`px-2 py-0.5 rounded-full ${
              trend.positive ? "bg-green-50" : "bg-red-50"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                trend.positive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.value}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-slate-800">{value}</Text>
      <Text className="text-sm text-slate-500 mt-0.5">{title}</Text>
      {subtitle && <Text className="text-xs text-slate-400 mt-0.5">{subtitle}</Text>}
    </Card>
  );
}
