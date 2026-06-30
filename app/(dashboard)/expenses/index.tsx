import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Receipt, Plus, Zap, Droplets, Wifi, Users, Wrench, MoreHorizontal } from "lucide-react-native";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/common/SectionHeader";
import EmptyState from "@/components/common/EmptyState";
import { formatCurrency, formatDate } from "@/utils/format";
import { useExpenses } from "@/hooks/useExpenses";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  electricity: Zap, water: Droplets, internet: Wifi,
  salary: Users, maintenance: Wrench, other: MoreHorizontal,
};
const CATEGORY_COLORS: Record<string, string> = {
  electricity: "#F59E0B", water: "#3B82F6", internet: "#8B5CF6",
  salary: "#22C55E", maintenance: "#EF4444", other: "#94A3B8",
};
const CATEGORY_BG: Record<string, string> = {
  electricity: "#FFFBEB", water: "#EFF6FF", internet: "#F5F3FF",
  salary: "#F0FDF4", maintenance: "#FEF2F2", other: "#F8FAFC",
};

export default function ExpensesScreen() {
  const { expenses, categoryTotals, total, loading, refetch } = useExpenses();

  const categoryEntries = Object.entries(categoryTotals) as [string, number][];

  return (
    <View className="flex-1">
      <Header
        title="Expenses"
        subtitle={`${expenses.length} records`}
        rightAction={
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/expenses/add" as never)}
            className="flex-row items-center bg-blue-600 px-3 py-2 rounded-xl gap-1"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-sm font-semibold">Add</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Total banner */}
        <Card className="bg-[#1E3A5F]">
          <Text className="text-blue-200 text-sm mb-1">Total Expenses</Text>
          <Text className="text-white text-3xl font-bold">{formatCurrency(total)}</Text>
        </Card>

        {/* By category */}
        {categoryEntries.length > 0 && (
          <View>
            <SectionHeader title="By Category" />
            <View className="flex-row flex-wrap gap-3">
              {categoryEntries.map(([cat, amt]) => {
                const Icon = CATEGORY_ICONS[cat] ?? MoreHorizontal;
                const color = CATEGORY_COLORS[cat] ?? "#94A3B8";
                const bg = CATEGORY_BG[cat] ?? "#F8FAFC";
                return (
                  <View
                    key={cat}
                    className="flex-1 min-w-[140px] rounded-2xl p-3 border border-slate-100"
                    style={{ backgroundColor: bg }}
                  >
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center mb-2"
                      style={{ backgroundColor: color + "25" }}
                    >
                      <Icon size={18} color={color} />
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{formatCurrency(amt)}</Text>
                    <Text className="text-xs text-slate-400 capitalize mt-0.5">{cat}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Expense list */}
        <View>
          <SectionHeader title="All Expenses" />
          {loading ? (
            <ActivityIndicator color="#2563EB" />
          ) : expenses.length === 0 ? (
            <EmptyState icon={<Receipt size={40} color="#94A3B8" />} title="No expenses yet" />
          ) : (
            <Card padding={false}>
              {expenses.map((e, i) => {
                const Icon = CATEGORY_ICONS[e.category] ?? MoreHorizontal;
                const color = CATEGORY_COLORS[e.category] ?? "#94A3B8";
                const bg = CATEGORY_BG[e.category] ?? "#F8FAFC";
                const isLast = i === expenses.length - 1;
                return (
                  <View
                    key={e.id}
                    className={`flex-row items-center px-4 py-3 ${!isLast ? "border-b border-slate-50" : ""}`}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: bg }}
                    >
                      <Icon size={18} color={color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{e.title}</Text>
                      <Text className="text-xs text-slate-400">
                        {(e as any).buildings?.name ?? "-"} · {formatDate(e.date)}
                      </Text>
                    </View>
                    <Text className="font-bold text-red-600 text-sm">-{formatCurrency(e.amount)}</Text>
                  </View>
                );
              })}
            </Card>
          )}
        </View>
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
