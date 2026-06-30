import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["S","M","T","W","T","F","S"];

type Resident = { move_in_date: string; move_out_date: string | null };

interface Props {
  residents: Resident[];
  totalBeds: number;
}

function rateToColor(rate: number, isFuture: boolean) {
  if (isFuture) return { bg: "#F8FAFC", text: "#CBD5E1" };
  if (rate === 0)  return { bg: "#F1F5F9", text: "#94A3B8" };
  if (rate <= 30)  return { bg: "#FECACA", text: "#991B1B" };
  if (rate <= 60)  return { bg: "#FDE68A", text: "#92400E" };
  if (rate <= 85)  return { bg: "#93C5FD", text: "#1E3A8A" };
  return              { bg: "#2563EB", text: "#FFFFFF" };
}

export default function OccupancyHeatmap({ residents, totalBeds }: Props) {
  const now = new Date();
  const [year, setMonth_year]  = useState(now.getFullYear());
  const [month, setMonth_idx]  = useState(now.getMonth());

  function prevMonth() {
    if (month === 0) { setMonth_idx(11); setMonth_year((y) => y - 1); }
    else setMonth_idx((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth_idx(0); setMonth_year((y) => y + 1); }
    else setMonth_idx((m) => m + 1);
  }

  const canNext = !(year === now.getFullYear() && month === now.getMonth());
  const today   = now.toISOString().split("T")[0];

  // Build cells
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun

  type Cell = { day: number | null; rate: number; occupied: number; isFuture: boolean };
  const cells: Cell[] = [];

  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, rate: 0, occupied: 0, isFuture: false });

  for (let d = 1; d <= daysInMonth; d++) {
    const mm     = String(month + 1).padStart(2, "0");
    const dd     = String(d).padStart(2, "0");
    const dayStr = `${year}-${mm}-${dd}`;
    const isFuture = dayStr > today;

    const occupied = (totalBeds === 0 || isFuture) ? 0
      : residents.filter((r) =>
          r.move_in_date <= dayStr &&
          (r.move_out_date === null || r.move_out_date >= dayStr)
        ).length;

    const capped = Math.min(occupied, totalBeds);
    const rate   = totalBeds > 0 && !isFuture ? Math.round((capped / totalBeds) * 100) : 0;
    cells.push({ day: d, rate, occupied: capped, isFuture });
  }

  // Chunk into rows of 7
  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  // Summary stats for this month
  const dayCells = cells.filter((c) => c.day !== null && !c.isFuture);
  const avgRate  = dayCells.length
    ? Math.round(dayCells.reduce((s, c) => s + c.rate, 0) / dayCells.length)
    : 0;
  const peakDay  = dayCells.reduce((a, b) => (a.rate >= b.rate ? a : b), dayCells[0]);
  const lowDay   = dayCells.reduce((a, b) => (a.rate <= b.rate ? a : b), dayCells[0]);

  return (
    <View>
      {/* Month navigation */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={prevMonth} className="p-2 rounded-xl bg-slate-100">
          <ChevronLeft size={16} color="#475569" />
        </TouchableOpacity>
        <Text className="font-bold text-slate-800 text-base">
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          className="p-2 rounded-xl bg-slate-100"
          disabled={!canNext}
          style={{ opacity: canNext ? 1 : 0.3 }}
        >
          <ChevronRight size={16} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Day-of-week labels */}
      <View className="flex-row mb-1.5">
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: "#94A3B8", fontWeight: "600" }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {rows.map((row, ri) => (
        <View key={ri} className="flex-row mb-1">
          {Array.from({ length: 7 }).map((_, ci) => {
            const cell = row[ci];
            if (!cell) return <View key={ci} style={{ flex: 1, marginHorizontal: 1 }} />;

            const isToday =
              cell.day !== null &&
              year  === now.getFullYear() &&
              month === now.getMonth() &&
              cell.day === now.getDate();

            const { bg, text } = rateToColor(cell.rate, cell.isFuture);

            return (
              <View key={ci} style={{ flex: 1, alignItems: "center", marginHorizontal: 1 }}>
                {cell.day ? (
                  <View
                    style={{
                      width: "100%",
                      aspectRatio: 1,
                      borderRadius: 6,
                      backgroundColor: bg,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: isToday ? 2 : 0,
                      borderColor: "#2563EB",
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: isToday ? "700" : "500", color: text }}>
                      {cell.day}
                    </Text>
                  </View>
                ) : (
                  <View style={{ width: "100%", aspectRatio: 1 }} />
                )}
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View className="flex-row flex-wrap items-center justify-center gap-3 mt-3 pt-3 border-t border-slate-50">
        {([
          { color: "#F1F5F9", label: "0%" },
          { color: "#FECACA", label: "≤30%" },
          { color: "#FDE68A", label: "≤60%" },
          { color: "#93C5FD", label: "≤85%" },
          { color: "#2563EB", label: "86–100%" },
        ] as const).map(({ color, label }) => (
          <View key={label} className="flex-row items-center gap-1">
            <View style={{
              width: 10, height: 10, borderRadius: 3,
              backgroundColor: color,
              borderWidth: 1, borderColor: "#E2E8F0",
            }} />
            <Text style={{ fontSize: 10, color: "#94A3B8" }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Monthly summary */}
      {dayCells.length > 0 && (
        <View className="flex-row justify-between mt-3 pt-3 border-t border-slate-50">
          <View className="items-center flex-1">
            <Text className="text-xs font-bold text-slate-700">{avgRate}%</Text>
            <Text style={{ fontSize: 10, color: "#94A3B8" }}>Avg this month</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xs font-bold text-green-600">{peakDay?.rate ?? 0}%</Text>
            <Text style={{ fontSize: 10, color: "#94A3B8" }}>Peak (day {peakDay?.day})</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xs font-bold text-red-400">{lowDay?.rate ?? 0}%</Text>
            <Text style={{ fontSize: 10, color: "#94A3B8" }}>Lowest (day {lowDay?.day})</Text>
          </View>
        </View>
      )}
    </View>
  );
}
