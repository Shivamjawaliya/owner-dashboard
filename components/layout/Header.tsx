import { View, Text, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { router, usePathname } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/utils/format";

interface Props {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export default function Header({ title, subtitle, rightAction }: Props) {
  const { top } = useSafeAreaInsets();
  const pathname = usePathname();
  const { profile } = useAuthStore();

  const isRoot =
    pathname === "/" ||
    pathname === "/(dashboard)" ||
    pathname.match(/^\/(buildings|residents|payments|bookings|expenses|employees|maintenance|reports|calendar|notifications|settings|support)$/) !== null;

  return (
    <View style={{ paddingTop: top }} className="bg-white border-b border-slate-100 px-4 pb-3">
      <View className="flex-row items-center">
        {!isRoot && (
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-slate-50 items-center justify-center mr-3"
          >
            <ChevronLeft size={20} color="#1E293B" />
          </TouchableOpacity>
        )}

        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-800">{title}</Text>
          {subtitle && <Text className="text-xs text-slate-400">{subtitle}</Text>}
        </View>

        {rightAction ?? (
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/profile" as never)}
            className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center overflow-hidden"
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} className="w-10 h-10 rounded-full" />
            ) : (
              <Text className="text-white font-bold text-sm">
                {profile?.name ? getInitials(profile.name) : "U"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
