import {
  View, Text, TouchableOpacity, ScrollView,
  Animated, Dimensions, Pressable,
} from "react-native";
import { useRef, useEffect } from "react";
import { router, usePathname } from "expo-router";
import {
  LayoutDashboard, Building2, Users, CalendarCheck2,
  CreditCard, Receipt, UserCog, Wrench, BarChart3,
  Calendar, Bell, Settings, HelpCircle, LogOut, X, ChevronRight,
} from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/ui.store";
import { SIDEBAR_WIDTH } from "@/constants";
import { getInitials } from "@/utils/format";

const { width: SCREEN_W } = Dimensions.get("window");

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    icon: LayoutDashboard, href: "/(dashboard)" },
  { label: "Buildings",    icon: Building2,       href: "/(dashboard)/buildings" },
  { label: "Residents",    icon: Users,           href: "/(dashboard)/residents" },
  { label: "Bookings",     icon: CalendarCheck2,  href: "/(dashboard)/bookings" },
  { label: "Payments",     icon: CreditCard,      href: "/(dashboard)/payments" },
  { label: "Expenses",     icon: Receipt,         href: "/(dashboard)/expenses" },
  { label: "Employees",    icon: UserCog,         href: "/(dashboard)/employees" },
  { label: "Maintenance",  icon: Wrench,          href: "/(dashboard)/maintenance" },
  { label: "Reports",      icon: BarChart3,       href: "/(dashboard)/reports" },
  { label: "Calendar",     icon: Calendar,        href: "/(dashboard)/calendar" },
  { label: "Notifications",icon: Bell,            href: "/(dashboard)/notifications" },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Settings", icon: Settings,   href: "/(dashboard)/settings" },
  { label: "Support",  icon: HelpCircle, href: "/(dashboard)/support" },
];

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isSidebarOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isSidebarOpen ? 0.5 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSidebarOpen]);

  function navigate(href: string) {
    closeSidebar();
    router.push(href as never);
  }

  function isActive(href: string) {
    if (href === "/(dashboard)") return pathname === "/" || pathname === "/(dashboard)";
    return pathname.startsWith(href.replace("/(dashboard)", ""));
  }

  return (
    <>
      {/* Overlay */}
      {isSidebarOpen && (
        <Pressable
          onPress={closeSidebar}
          className="absolute inset-0 z-40"
          style={{ backgroundColor: "transparent" }}
        >
          <Animated.View
            style={{ flex: 1, backgroundColor: "#000", opacity: overlayOpacity }}
          />
        </Pressable>
      )}

      {/* Drawer */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          zIndex: 50,
          transform: [{ translateX }],
        }}
      >
        <View className="flex-1 bg-[#1E3A5F]">
          {/* Header */}
          <View className="pt-14 pb-5 px-5 border-b border-white/10 flex-row items-center justify-between">
            <View>
              <Text className="text-white text-xl font-bold">PG Owner</Text>
              <Text className="text-blue-300 text-xs mt-0.5">Management Dashboard</Text>
            </View>
            <TouchableOpacity onPress={closeSidebar} className="p-1">
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* User Profile */}
          {profile && (
            <View className="px-4 py-4 border-b border-white/10 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
                <Text className="text-white font-bold text-sm">{getInitials(profile.name)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                  {profile.name}
                </Text>
                <Text className="text-blue-300 text-xs capitalize" numberOfLines={1}>{profile.role}</Text>
              </View>
            </View>
          )}

          {/* Nav Items */}
          <ScrollView className="flex-1 py-3" showsVerticalScrollIndicator={false}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.href}
                  onPress={() => navigate(item.href)}
                  className={`mx-3 mb-0.5 flex-row items-center px-3 py-3 rounded-xl ${
                    active ? "bg-white/15" : ""
                  }`}
                >
                  <Icon
                    size={20}
                    color={active ? "#FFFFFF" : "#94A3B8"}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <Text
                    className={`ml-3 flex-1 text-sm ${
                      active ? "text-white font-semibold" : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </Text>
                  {item.badge != null && item.badge > 0 && (
                    <View className="bg-blue-500 rounded-full px-1.5 py-0.5 min-w-[20px] items-center">
                      <Text className="text-white text-xs font-bold">{item.badge}</Text>
                    </View>
                  )}
                  {active && <ChevronRight size={14} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}

            {/* Divider */}
            <View className="mx-4 my-3 border-t border-white/10" />

            {BOTTOM_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.href}
                  onPress={() => navigate(item.href)}
                  className={`mx-3 mb-0.5 flex-row items-center px-3 py-3 rounded-xl ${
                    active ? "bg-white/15" : ""
                  }`}
                >
                  <Icon size={20} color={active ? "#FFFFFF" : "#94A3B8"} />
                  <Text className={`ml-3 text-sm ${active ? "text-white font-semibold" : "text-slate-400"}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Logout */}
          <TouchableOpacity
            onPress={signOut}
            className="mx-3 mb-8 flex-row items-center px-3 py-3 rounded-xl border border-white/10"
          >
            <LogOut size={20} color="#F87171" />
            <Text className="ml-3 text-sm text-red-400 font-medium">Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}
