import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from "react-native";
import { router } from "expo-router";
import { UserCog, Plus, Phone } from "lucide-react-native";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/common/EmptyState";
import { getInitials, formatCurrency } from "@/utils/format";
import { useEmployees } from "@/hooks/useEmployees";

const ROLE_COLORS: Record<string, string> = {
  manager: "#2563EB", security: "#8B5CF6", cleaner: "#22C55E",
  electrician: "#F59E0B", plumber: "#EF4444", cook: "#EC4899", other: "#94A3B8",
};

export default function EmployeesScreen() {
  const { employees, payroll, loading, refetch } = useEmployees();

  const activeCount   = employees.filter((e) => e.status === "active").length;
  const inactiveCount = employees.filter((e) => e.status === "inactive").length;

  return (
    <View className="flex-1">
      <Header
        title="Employees"
        subtitle={`${employees.length} staff members`}
        rightAction={
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/employees/add" as never)}
            className="flex-row items-center bg-blue-600 px-3 py-2 rounded-xl gap-1"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-sm font-semibold">Add</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Payroll Banner */}
        <View className="bg-[#1E3A5F] rounded-2xl p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-blue-200 text-sm">Monthly Payroll</Text>
            <Text className="text-white text-2xl font-bold mt-0.5">{formatCurrency(payroll)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-blue-300 text-sm">{activeCount} Active</Text>
            <Text className="text-blue-400 text-xs">{inactiveCount} Inactive</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#2563EB" />
        ) : employees.length === 0 ? (
          <EmptyState
            icon={<UserCog size={40} color="#94A3B8" />}
            title="No employees yet"
            description="Add staff members to manage your PG"
          />
        ) : (
          employees.map((e) => {
            const roleColor = ROLE_COLORS[e.role] ?? "#94A3B8";
            return (
              <Card key={e.id}>
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full overflow-hidden items-center justify-center mr-3"
                    style={{ backgroundColor: roleColor + "20" }}
                  >
                    {e.avatar_url ? (
                      <Image source={{ uri: e.avatar_url }} style={{ width: 48, height: 48 }} resizeMode="cover" />
                    ) : (
                      <Text className="font-bold text-sm" style={{ color: roleColor }}>
                        {getInitials(e.name)}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-semibold text-slate-800">{e.name}</Text>
                      <Badge
                        label={e.status === "active" ? "Active" : "Inactive"}
                        variant={e.status === "active" ? "success" : "neutral"}
                      />
                    </View>
                    <View
                      className="self-start mt-1 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: roleColor + "20" }}
                    >
                      <Text className="text-xs font-semibold capitalize" style={{ color: roleColor }}>
                        {e.role}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-400 mt-1">
                      {(e as any).buildings?.name ?? "All Buildings"}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-bold text-slate-800">{formatCurrency(e.salary)}</Text>
                    <Text className="text-xs text-slate-400">/ month</Text>
                    <View className="flex-row items-center mt-1">
                      <Phone size={11} color="#94A3B8" />
                      <Text className="text-xs text-slate-400 ml-1">{e.phone}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
