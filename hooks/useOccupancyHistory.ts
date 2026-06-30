import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";

export type MonthOccupancy = {
  label: string;
  occupied: number;
  empty: number;
  total: number;
  rate: number;
};

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getLastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay  = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      label:    MONTH_LABELS[d.getMonth()],
      firstStr: firstDay.toISOString().split("T")[0],
      lastStr:  lastDay.toISOString().split("T")[0],
    };
  });
}

export function useOccupancyHistory() {
  const { user } = useAuthStore();
  const [data, setData]       = useState<MonthOccupancy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [buildingsRes, residentsRes] = await Promise.all([
        supabase
          .from("buildings")
          .select("rooms(beds(id))")
          .eq("owner_id", user.id),
        supabase
          .from("residents")
          .select("move_in_date, move_out_date")
          .eq("owner_id", user.id),
      ]);

      const totalBeds = (buildingsRes.data ?? []).reduce((sum: number, b: any) =>
        sum + (b.rooms ?? []).reduce((s: number, r: any) => s + (r.beds ?? []).length, 0), 0);

      const residents = residentsRes.data ?? [];
      const months    = getLastSixMonths();

      const monthData: MonthOccupancy[] = months.map(({ label, firstStr, lastStr }) => {
        const occupied = residents.filter((r: any) =>
          r.move_in_date <= lastStr &&
          (r.move_out_date === null || r.move_out_date >= firstStr)
        ).length;
        const capped = Math.min(occupied, totalBeds);
        const empty  = Math.max(0, totalBeds - capped);
        const rate   = totalBeds > 0 ? Math.round((capped / totalBeds) * 100) : 0;
        return { label, occupied: capped, empty, total: totalBeds, rate };
      });

      setData(monthData);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}
