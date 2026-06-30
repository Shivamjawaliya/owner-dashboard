import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePathname, router } from "expo-router";
import { LayoutDashboard, UserCircle } from "lucide-react-native";

const TABS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/(dashboard)" },
  { label: "Profile",   icon: UserCircle,      href: "/(dashboard)/profile" },
];

export default function BottomNav() {
  const { bottom } = useSafeAreaInsets();
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/(dashboard)") return pathname === "/" || pathname === "/(dashboard)" || pathname === "/index";
    return pathname.startsWith(href.replace("/(dashboard)", ""));
  }

  return (
    <View
      style={{ paddingBottom: bottom || 8 }}
      className="bg-white border-t border-slate-100 flex-row px-2 pt-2"
    >
      {TABS.map((tab) => {
        const active = isActive(tab.href);
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.href}
            onPress={() => router.push(tab.href as never)}
            className="flex-1 items-center py-1"
          >
            <View className={`p-1.5 rounded-xl ${active ? "bg-blue-50" : ""}`}>
              <Icon size={22} color={active ? "#2563EB" : "#94A3B8"} strokeWidth={active ? 2.5 : 2} />
            </View>
            <Text className={`text-[10px] mt-0.5 font-medium ${active ? "text-blue-600" : "text-slate-400"}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
