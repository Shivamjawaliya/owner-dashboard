import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, Users, Building2, Receipt } from "lucide-react-native";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import { formatCurrency } from "@/utils/format";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { useResidents } from "@/hooks/useResidents";
import { useOccupancyHistory } from "@/hooks/useOccupancyHistory";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getLastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
  });
}

type BuildingOccupancy = { name: string; totalBeds: number; occupiedBeds: number };

export default function ReportsScreen() {
  const { user }                              = useAuthStore();
  const { payments, loading: pLoad, refetch: refetchP } = usePayments();
  const { expenses, loading: eLoad, refetch: refetchE } = useExpenses();
  const { residents, loading: rLoad, refetch: refetchR } = useResidents();
  const { data: occupancyHistory, loading: oHistLoad, refetch: refetchOHist } = useOccupancyHistory();

  const [buildingOccupancy, setBuildingOccupancy] = useState<BuildingOccupancy[]>([]);
  const [occLoading, setOccLoading]               = useState(true);

  const fetchOccupancy = useCallback(async () => {
    if (!user) return;
    setOccLoading(true);
    const { data } = await supabase
      .from("buildings")
      .select("id, name, rooms(id, beds(is_occupied))")
      .eq("owner_id", user.id);

    const occ: BuildingOccupancy[] = (data ?? []).map((b: any) => {
      const beds: { is_occupied: boolean }[] = (b.rooms ?? []).flatMap((r: any) => r.beds ?? []);
      return {
        name:         b.name,
        totalBeds:    beds.length,
        occupiedBeds: beds.filter((bed) => bed.is_occupied).length,
      };
    });
    setBuildingOccupancy(occ);
    setOccLoading(false);
  }, [user]);

  useEffect(() => { fetchOccupancy(); }, [fetchOccupancy]);

  const loading = pLoad || eLoad || rLoad || occLoading || oHistLoad;

  function handleRefresh() {
    refetchP(); refetchE(); refetchR(); fetchOccupancy(); refetchOHist();
  }

  // ── YTD Revenue (paid payments in current calendar year) ──
  const currentYear = new Date().getFullYear().toString();
  const ytdRevenue = payments
    .filter((p) => p.status === "paid" && p.paid_date?.startsWith(currentYear))
    .reduce((sum, p) => sum + p.amount, 0);

  // ── YTD Expenses (current year) ──
  const ytdExpenses = expenses
    .filter((e) => e.date.startsWith(currentYear))
    .reduce((sum, e) => sum + e.amount, 0);

  // ── Occupancy Rate ──
  const totalBeds    = buildingOccupancy.reduce((s, b) => s + b.totalBeds, 0);
  const occupiedBeds = buildingOccupancy.reduce((s, b) => s + b.occupiedBeds, 0);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // ── Active residents ──
  const activeResidents = residents.filter((r) => r.status === "active").length;

  // ── Monthly revenue (last 6 months) ──
  const sixMonths = getLastSixMonths();
  const monthlyRevenue = sixMonths.map(({ year, month, label }) => {
    const value = payments
      .filter((p) => {
        if (p.status !== "paid" || !p.paid_date) return false;
        const d = new Date(p.paid_date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    return { label, value };
  });
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.value), 1);

  const KPI_CARDS = [
    { label: "Revenue (YTD)",  value: formatCurrency(ytdRevenue),   icon: TrendingUp, color: "#22C55E", bg: "#F0FDF4" },
    { label: "Active Residents", value: String(activeResidents),    icon: Users,      color: "#2563EB", bg: "#EFF6FF" },
    { label: "Occupancy Rate", value: `${occupancyRate}%`,          icon: Building2,  color: "#8B5CF6", bg: "#F5F3FF" },
    { label: "Expenses (YTD)", value: formatCurrency(ytdExpenses),  icon: Receipt,    color: "#F59E0B", bg: "#FFFBEB" },
  ];

  return (
    <View className="flex-1">
      <Header title="Reports" subtitle="Performance overview" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <ActivityIndicator color="#2563EB" size="large" className="mt-10" />
        ) : (
          <>
            {/* KPI Cards */}
            <View className="flex-row flex-wrap gap-3">
              {KPI_CARDS.map((r) => {
                const Icon = r.icon;
                return (
                  <Card key={r.label} className="flex-1 min-w-[150px]">
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center mb-3"
                      style={{ backgroundColor: r.bg }}
                    >
                      <Icon size={18} color={r.color} />
                    </View>
                    <Text className="text-xl font-bold text-slate-800">{r.value}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{r.label}</Text>
                  </Card>
                );
              })}
            </View>

            {/* Monthly Revenue Chart */}
            <Card>
              <Text className="font-bold text-slate-800 mb-1">Monthly Revenue</Text>
              <Text className="text-xs text-slate-400 mb-4">Last 6 months (paid only)</Text>
              {monthlyRevenue.every((m) => m.value === 0) ? (
                <View className="items-center py-6">
                  <BarChart3 size={32} color="#CBD5E1" />
                  <Text className="text-slate-400 text-sm mt-2">No paid payments yet</Text>
                </View>
              ) : (
                <View className="flex-row items-end gap-2 h-36">
                  {monthlyRevenue.map((m, idx) => {
                    const barH  = maxRevenue > 0 ? (m.value / maxRevenue) * 100 : 0;
                    const isMax = m.value === maxRevenue && m.value > 0;
                    return (
                      <View key={m.label + idx} className="flex-1 items-center">
                        {m.value > 0 && (
                          <Text className="text-slate-400 mb-1" style={{ fontSize: 9 }}>
                            {(m.value / 1000).toFixed(0)}k
                          </Text>
                        )}
                        <View
                          className={`w-full rounded-t-lg ${isMax ? "bg-blue-600" : "bg-blue-200"}`}
                          style={{ height: barH > 0 ? `${barH}%` : 4 }}
                        />
                        <Text className="text-xs text-slate-400 mt-1">{m.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>

            {/* Occupancy Rate Chart */}
            <Card>
              <Text className="font-bold text-slate-800 mb-1">Occupancy Rate</Text>
              <Text className="text-xs text-slate-400 mb-4">Beds occupied vs empty — last 6 months</Text>

              {occupancyHistory.length === 0 || occupancyHistory.every((m) => m.total === 0) ? (
                <View className="items-center py-6">
                  <BarChart3 size={32} color="#CBD5E1" />
                  <Text className="text-slate-400 text-sm mt-2">No bed data yet</Text>
                </View>
              ) : (
                <>
                  {/* Grouped bar chart */}
                  <View className="flex-row items-end gap-1.5" style={{ height: 140 }}>
                    {occupancyHistory.map((m, idx) => {
                      const maxBeds  = Math.max(...occupancyHistory.map((x) => x.total), 1);
                      const occH     = m.total > 0 ? (m.occupied / maxBeds) * 100 : 0;
                      const emptyH   = m.total > 0 ? (m.empty    / maxBeds) * 100 : 0;
                      const isLatest = idx === occupancyHistory.length - 1;
                      return (
                        <View key={m.label + idx} className="flex-1 items-center">
                          {/* value label on tallest bar of latest month */}
                          {isLatest && m.total > 0 && (
                            <Text className="text-slate-500 mb-1" style={{ fontSize: 9 }}>
                              {m.rate}%
                            </Text>
                          )}
                          {/* Two bars side-by-side */}
                          <View className="flex-row items-end gap-0.5 w-full">
                            {/* Occupied bar */}
                            <View
                              className="flex-1 rounded-t-md"
                              style={{
                                height: occH > 0 ? `${occH}%` : 3,
                                backgroundColor: isLatest ? "#2563EB" : "#93C5FD",
                                minHeight: 3,
                              }}
                            />
                            {/* Empty bar */}
                            <View
                              className="flex-1 rounded-t-md"
                              style={{
                                height: emptyH > 0 ? `${emptyH}%` : 3,
                                backgroundColor: "#E2E8F0",
                                minHeight: 3,
                              }}
                            />
                          </View>
                          <Text className="text-[9px] text-slate-400 mt-1">{m.label}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Legend */}
                  <View className="flex-row gap-4 mt-3 mb-1">
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-3 h-3 rounded-sm bg-blue-500" />
                      <Text className="text-xs text-slate-500">Occupied</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-3 h-3 rounded-sm bg-slate-200" />
                      <Text className="text-xs text-slate-500">Empty</Text>
                    </View>
                  </View>

                  {/* Summary row */}
                  {(() => {
                    const valid    = occupancyHistory.filter((m) => m.total > 0);
                    const peak     = valid.reduce((a, b) => a.rate >= b.rate ? a : b, valid[0]);
                    const lowest   = valid.reduce((a, b) => a.rate <= b.rate ? a : b, valid[0]);
                    const current  = occupancyHistory[occupancyHistory.length - 1];
                    return (
                      <View className="mt-3 pt-3 border-t border-slate-50 flex-row justify-between flex-wrap gap-2">
                        <View className="items-center">
                          <Text className="text-xs font-bold text-blue-600">{current?.rate ?? 0}%</Text>
                          <Text className="text-[10px] text-slate-400">Current</Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-xs font-bold text-green-600">{peak?.rate ?? 0}%</Text>
                          <Text className="text-[10px] text-slate-400">Peak ({peak?.label})</Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-xs font-bold text-red-400">{lowest?.rate ?? 0}%</Text>
                          <Text className="text-[10px] text-slate-400">Lowest ({lowest?.label})</Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-xs font-bold text-slate-600">
                            {current ? `${current.occupied}/${current.total}` : "0/0"}
                          </Text>
                          <Text className="text-[10px] text-slate-400">Beds now</Text>
                        </View>
                      </View>
                    );
                  })()}
                </>
              )}
            </Card>

            {/* Building-wise Occupancy */}
            <Card>
              <Text className="font-bold text-slate-800 mb-4">Building-wise Occupancy</Text>
              {buildingOccupancy.length === 0 ? (
                <Text className="text-slate-400 text-sm text-center py-4">No buildings found</Text>
              ) : (
                buildingOccupancy.map((b, i) => {
                  const pct   = b.totalBeds > 0 ? Math.round((b.occupiedBeds / b.totalBeds) * 100) : 0;
                  const color = pct >= 85 ? "#22C55E" : pct >= 60 ? "#F59E0B" : "#EF4444";
                  return (
                    <View key={b.name} className={i < buildingOccupancy.length - 1 ? "mb-4" : ""}>
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className="text-sm font-medium text-slate-700 flex-1 mr-2" numberOfLines={1}>
                          {b.name}
                        </Text>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs text-slate-400">
                            {b.occupiedBeds}/{b.totalBeds} beds
                          </Text>
                          <Text className="text-xs font-semibold" style={{ color }}>{pct}%</Text>
                        </View>
                      </View>
                      <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <View
                          className="h-2 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </View>
                    </View>
                  );
                })
              )}

              {/* Summary footer */}
              {totalBeds > 0 && (
                <View className="mt-4 pt-3 border-t border-slate-50 flex-row justify-between">
                  <Text className="text-xs text-slate-400">Total: {occupiedBeds}/{totalBeds} beds occupied</Text>
                  <Text className="text-xs font-semibold text-slate-600">{occupancyRate}% overall</Text>
                </View>
              )}
            </Card>

            {/* Expense vs Revenue */}
            {(ytdRevenue > 0 || ytdExpenses > 0) && (
              <Card>
                <Text className="font-bold text-slate-800 mb-4">Revenue vs Expenses (YTD)</Text>
                <View className="gap-3">
                  {[
                    { label: "Revenue", amount: ytdRevenue, color: "#22C55E" },
                    { label: "Expenses", amount: ytdExpenses, color: "#EF4444" },
                  ].map(({ label, amount, color }) => {
                    const maxAmt = Math.max(ytdRevenue, ytdExpenses, 1);
                    const pct    = Math.round((amount / maxAmt) * 100);
                    return (
                      <View key={label}>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-sm font-medium text-slate-700">{label}</Text>
                          <Text className="text-sm font-bold" style={{ color }}>{formatCurrency(amount)}</Text>
                        </View>
                        <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <View className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </View>
                      </View>
                    );
                  })}
                  <View className="mt-1">
                    <Text className="text-xs text-slate-400">
                      Net: {" "}
                      <Text
                        className="font-semibold"
                        style={{ color: ytdRevenue - ytdExpenses >= 0 ? "#22C55E" : "#EF4444" }}
                      >
                        {formatCurrency(Math.abs(ytdRevenue - ytdExpenses))}
                        {ytdRevenue - ytdExpenses >= 0 ? " profit" : " loss"}
                      </Text>
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
