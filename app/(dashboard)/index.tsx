import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { router } from "expo-router";
import {
  Building2, Users, CreditCard, Receipt, TrendingUp,
  CalendarCheck, Briefcase, Wrench, BarChart2, Grid3X3,
} from "lucide-react-native";
import Header from "@/components/layout/Header";
import StatCard from "@/components/dashboard/StatCard";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/common/SectionHeader";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils/format";
import { useBuildings } from "@/hooks/useBuildings";
import { useResidents } from "@/hooks/useResidents";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardHome() {
  const { profile } = useAuthStore();
  const { buildings, refetch: refetchBuildings } = useBuildings();
  const { residents, refetch: refetchResidents }  = useResidents();
  const { payments, summary, loading: paymentsLoading, refetch: refetchPayments } = usePayments();
  const { total: totalExpenses, refetch: refetchExpenses } = useExpenses();

  const loading = paymentsLoading;

  async function onRefresh() {
    await Promise.all([refetchBuildings(), refetchResidents(), refetchPayments(), refetchExpenses()]);
  }

  const recentPayments = payments.slice(0, 5);
  const activeResidents = residents.filter((r) => r.status === "active").length;

  const STATS = [
    {
      title: "Total Buildings", value: String(buildings.length),
      icon: <Building2 size={20} color="#2563EB" />, color: "#2563EB",
    },
    {
      title: "Active Residents", value: String(activeResidents),
      icon: <Users size={20} color="#8B5CF6" />, color: "#8B5CF6",
    },
    {
      title: "Rent Collected", value: formatCurrency(summary.collected),
      icon: <CreditCard size={20} color="#22C55E" />, color: "#22C55E",
    },
    {
      title: "Total Expenses", value: formatCurrency(totalExpenses),
      icon: <Receipt size={20} color="#F59E0B" />, color: "#F59E0B",
    },
  ];

  return (
    <View className="flex-1">
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${profile?.name?.split(" ")[0] ?? "Owner"}`}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Banner */}
        <View className="bg-[#1E3A5F] rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-blue-200 text-sm font-medium">Rent Summary</Text>
              <Text className="text-white text-3xl font-bold mt-0.5">
                {formatCurrency(summary.collected)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-blue-300 text-sm">
                Pending: {formatCurrency(summary.pending)}
              </Text>
              <Text className="text-red-300 text-xs mt-0.5">
                Overdue: {formatCurrency(summary.overdue)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stat Cards */}
        <View>
          <SectionHeader title="Overview" />
          <View className="flex-row flex-wrap gap-3">
            {STATS.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                accentColor={stat.color}
              />
            ))}
          </View>
        </View>

        {/* Recent Payments */}
        {recentPayments.length > 0 && (
          <View>
            <SectionHeader title="Recent Payments" onViewAll={() => router.push("/(dashboard)/payments")} />
            <Card padding={false}>
              {recentPayments.map((p, i) => {
                const isLast = i === recentPayments.length - 1;
                const badgeVariant =
                  p.status === "paid" ? "success" : p.status === "overdue" ? "danger" : "warning";
                const name = (p as any).residents?.name ?? "Resident";
                return (
                  <TouchableOpacity
                    key={p.id}
                    className={`flex-row items-center px-4 py-3 ${!isLast ? "border-b border-slate-50" : ""}`}
                    onPress={() => router.push("/(dashboard)/payments")}
                  >
                    <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center mr-3">
                      <Text className="text-slate-600 text-xs font-bold">
                        {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-slate-800">{name}</Text>
                      <Text className="text-xs text-slate-400">
                        Room {(p as any).rooms?.room_number ?? "-"} · {formatDate(p.due_date)}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-sm font-bold text-slate-800">
                        {formatCurrency(p.amount)}
                      </Text>
                      <Badge label={p.status} variant={badgeVariant} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        )}

        {/* Features Grid */}
        <View>
          <SectionHeader title="Features" />
          <View className="flex-row flex-wrap gap-3">
            {[
              { label: "Buildings",    icon: <Building2     size={26} color="#2563EB" />, bg: "#EFF6FF", route: "/(dashboard)/buildings" },
              { label: "Residents",    icon: <Users         size={26} color="#8B5CF6" />, bg: "#F5F3FF", route: "/(dashboard)/residents" },
              { label: "Payments",     icon: <CreditCard    size={26} color="#22C55E" />, bg: "#F0FDF4", route: "/(dashboard)/payments" },
              { label: "Bookings",     icon: <CalendarCheck size={26} color="#0EA5E9" />, bg: "#F0F9FF", route: "/(dashboard)/bookings" },
              { label: "Expenses",     icon: <Receipt       size={26} color="#F59E0B" />, bg: "#FFFBEB", route: "/(dashboard)/expenses" },
              { label: "Employees",    icon: <Briefcase     size={26} color="#EC4899" />, bg: "#FDF2F8", route: "/(dashboard)/employees" },
              { label: "Maintenance",  icon: <Wrench        size={26} color="#EF4444" />, bg: "#FFF1F2", route: "/(dashboard)/maintenance" },
              { label: "Reports",      icon: <BarChart2      size={26} color="#6366F1" />, bg: "#EEF2FF", route: "/(dashboard)/reports" },
              { label: "Heatmap",      icon: <Grid3X3        size={26} color="#0D9488" />, bg: "#F0FDFA", route: "/(dashboard)/heatmap" },
            ].map((f) => (
              <TouchableOpacity
                key={f.label}
                onPress={() => router.push(f.route as never)}
                className="rounded-2xl py-4 items-center border border-slate-100"
                style={{ backgroundColor: f.bg, width: "22%", flexGrow: 1 }}
              >
                {f.icon}
                <Text className="text-xs font-semibold text-slate-700 mt-2 text-center">{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="pb-6">
          <SectionHeader title="Quick Actions" />
          <View className="flex-row flex-wrap gap-3">
            {[
              { label: "Add Resident", color: "#2563EB", bg: "#EFF6FF", route: "/(dashboard)/residents/add" },
              { label: "Record Payment", color: "#22C55E", bg: "#F0FDF4", route: "/(dashboard)/payments" },
              { label: "Add Expense",   color: "#F59E0B", bg: "#FFFBEB", route: "/(dashboard)/expenses" },
              { label: "Add Building",  color: "#8B5CF6", bg: "#F5F3FF", route: "/(dashboard)/buildings/add" },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                onPress={() => router.push(a.route as never)}
                className="flex-1 min-w-[140px] rounded-2xl py-4 items-center border border-slate-100"
                style={{ backgroundColor: a.bg }}
              >
                <TrendingUp size={22} color={a.color} />
                <Text className="text-sm font-semibold mt-2" style={{ color: a.color }}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
