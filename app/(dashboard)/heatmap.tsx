import { View, Text, ScrollView, RefreshControl } from "react-native";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import OccupancyHeatmap from "@/components/reports/OccupancyHeatmap";
import { useResidents } from "@/hooks/useResidents";
import { useAuthStore } from "@/store/auth.store";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export default function HeatmapScreen() {
  const { user } = useAuthStore();
  const { residents, loading: rLoad, refetch } = useResidents();
  const [totalBeds, setTotalBeds] = useState(0);
  const [bedsLoading, setBedsLoading] = useState(true);

  const fetchBeds = useCallback(async () => {
    if (!user) return;
    setBedsLoading(true);
    const { data } = await supabase
      .from("buildings")
      .select("rooms(beds(id))")
      .eq("owner_id", user.id);
    const total = (data ?? []).reduce((sum: number, b: any) =>
      sum + (b.rooms ?? []).reduce((s: number, r: any) => s + (r.beds ?? []).length, 0), 0);
    setTotalBeds(total);
    setBedsLoading(false);
  }, [user]);

  useEffect(() => { fetchBeds(); }, [fetchBeds]);

  const loading = rLoad || bedsLoading;

  return (
    <View className="flex-1 bg-slate-50">
      <Header title="Occupancy Heatmap" subtitle="Daily bed occupancy by color" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => { refetch(); fetchBeds(); }} />
        }
      >
        <Card>
          <OccupancyHeatmap
            residents={residents.map((r) => ({
              move_in_date:  r.move_in_date,
              move_out_date: r.move_out_date ?? null,
            }))}
            totalBeds={totalBeds}
          />
        </Card>
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
