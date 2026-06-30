import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";

interface Props {
  title: string;
  onViewAll?: () => void;
}

export default function SectionHeader({ title, onViewAll }: Props) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-base font-bold text-slate-800">{title}</Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} className="flex-row items-center">
          <Text className="text-sm text-blue-600 mr-0.5">View All</Text>
          <ChevronRight size={14} color="#2563EB" />
        </TouchableOpacity>
      )}
    </View>
  );
}
