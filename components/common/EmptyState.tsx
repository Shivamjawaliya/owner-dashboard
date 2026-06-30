import { View, Text } from "react-native";
import Button from "@/components/ui/Button";

interface Props {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-4">
        {icon}
      </View>
      <Text className="text-lg font-semibold text-slate-700 text-center mb-2">{title}</Text>
      {description && (
        <Text className="text-sm text-slate-400 text-center mb-6">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} size="sm" />
      )}
    </View>
  );
}
