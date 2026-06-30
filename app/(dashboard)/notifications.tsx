import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useState } from "react";
import {
  Bell, CreditCard, UserPlus, Wrench, AlertTriangle, CheckCircle2, Info,
} from "lucide-react-native";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";

type NType = "payment" | "resident" | "maintenance" | "warning" | "success" | "info";

const NOTIFICATIONS = [
  { id: "1", type: "payment" as NType,     title: "Payment Received",      body: "Amit Kumar paid ₹8,500 for January rent",     time: "2 min ago",   read: false },
  { id: "2", type: "resident" as NType,    title: "New Resident Added",    body: "Vikram Shah moved into Room 201 - Sunrise PG", time: "1 hr ago",    read: false },
  { id: "3", type: "maintenance" as NType, title: "Maintenance Request",   body: "Pipe leakage reported in Room 204",             time: "3 hr ago",    read: false },
  { id: "4", type: "warning" as NType,     title: "Payment Overdue",       body: "Neha Sharma's rent is 10 days overdue",         time: "5 hr ago",    read: true },
  { id: "5", type: "success" as NType,     title: "Booking Confirmed",     body: "Anjali Mehta's booking confirmed for Feb 10",   time: "Yesterday",   read: true },
  { id: "6", type: "info" as NType,        title: "Subscription Renewal",  body: "Your plan renews in 7 days",                    time: "2 days ago",  read: true },
  { id: "7", type: "payment" as NType,     title: "Payment Received",      body: "Priya Singh paid ₹7,000 via UPI",               time: "3 days ago",  read: true },
];

const iconMap: Record<NType, { icon: React.ElementType; bg: string; color: string }> = {
  payment:     { icon: CreditCard,   bg: "#F0FDF4", color: "#22C55E" },
  resident:    { icon: UserPlus,     bg: "#EFF6FF", color: "#2563EB" },
  maintenance: { icon: Wrench,       bg: "#FEF2F2", color: "#EF4444" },
  warning:     { icon: AlertTriangle,bg: "#FFFBEB", color: "#F59E0B" },
  success:     { icon: CheckCircle2, bg: "#F0FDF4", color: "#22C55E" },
  info:        { icon: Info,         bg: "#F5F3FF", color: "#8B5CF6" },
};

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const unread = notifications.filter((n) => !n.read).length;

  async function onRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <View className="flex-1">
      <Header
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "All caught up"}
        rightAction={
          unread > 0 ? (
            <TouchableOpacity onPress={markAllRead}>
              <Text className="text-blue-600 text-sm font-medium">Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-4">
              <Bell size={36} color="#94A3B8" />
            </View>
            <Text className="text-slate-600 font-semibold text-lg">No notifications</Text>
            <Text className="text-slate-400 text-sm mt-1">You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((n) => {
            const { icon: Icon, bg, color } = iconMap[n.type];
            return (
              <TouchableOpacity
                key={n.id}
                onPress={() =>
                  setNotifications((prev) =>
                    prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                  )
                }
              >
                <View
                  className={`flex-row items-start p-4 rounded-2xl border ${
                    !n.read ? "bg-blue-50 border-blue-100" : "bg-white border-slate-100"
                  }`}
                >
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 flex-shrink-0" style={{ backgroundColor: bg }}>
                    <Icon size={18} color={color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-semibold text-slate-800 text-sm flex-1" numberOfLines={1}>
                        {n.title}
                      </Text>
                      {!n.read && <View className="w-2 h-2 rounded-full bg-blue-600" />}
                    </View>
                    <Text className="text-xs text-slate-500 mt-0.5 leading-4">{n.body}</Text>
                    <Text className="text-xs text-slate-400 mt-1.5">{n.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
