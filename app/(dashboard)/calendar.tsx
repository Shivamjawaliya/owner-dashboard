import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react-native";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/utils/format";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const EVENTS = [
  { id: "1", date: "2024-01-05", title: "Rent Due Date",           type: "payment",     building: "All" },
  { id: "2", date: "2024-01-08", title: "Maintenance: Room 204",    type: "maintenance", building: "Sunrise PG" },
  { id: "3", date: "2024-01-10", title: "Anjali Mehta Check-in",   type: "booking",     building: "Green Valley" },
  { id: "4", date: "2024-01-15", title: "Monthly Review",           type: "general",     building: "All" },
  { id: "5", date: "2024-01-20", title: "Suresh Reddy Move-out",   type: "moveout",     building: "City Square" },
  { id: "6", date: "2024-01-25", title: "Electricity Bill Due",     type: "expense",     building: "All" },
];

const typeColors: Record<string, string> = {
  payment: "#22C55E", maintenance: "#EF4444", booking: "#2563EB",
  general: "#8B5CF6", moveout: "#F59E0B", expense: "#EC4899",
};
const typeVariant: Record<string, "success" | "danger" | "primary" | "neutral" | "warning"> = {
  payment: "success", maintenance: "danger", booking: "primary",
  general: "neutral", moveout: "warning", expense: "neutral",
};

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const selectedDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const dayEvents = EVENTS.filter((e) => e.date === selectedDateStr);

  const eventDates = new Set(EVENTS.map((e) => e.date));

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View className="flex-1">
      <Header title="Calendar" subtitle="Events & Schedule" />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Card>
          {/* Month nav */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={prevMonth} className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
              <ChevronLeft size={18} color="#64748B" />
            </TouchableOpacity>
            <Text className="font-bold text-slate-800 text-base">{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
              <ChevronRight size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View className="flex-row mb-2">
            {DAYS.map((d) => (
              <View key={d} className="flex-1 items-center">
                <Text className="text-xs text-slate-400 font-medium">{d}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View className="flex-row flex-wrap">
            {cells.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} className="flex-1 min-w-[14%] aspect-square" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const isSelected = day === selectedDay;
              const hasEvent = eventDates.has(dateStr);
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  className={`flex-1 min-w-[14%] aspect-square items-center justify-center rounded-full ${
                    isSelected ? "bg-blue-600" : isToday ? "bg-blue-50" : ""
                  }`}
                >
                  <Text className={`text-sm font-medium ${isSelected ? "text-white" : isToday ? "text-blue-600" : "text-slate-700"}`}>
                    {day}
                  </Text>
                  {hasEvent && !isSelected && (
                    <View className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-1" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Day events */}
        <View>
          <Text className="font-bold text-slate-800 mb-3">
            {formatDate(selectedDateStr)}
          </Text>
          {dayEvents.length === 0 ? (
            <View className="items-center py-8">
              <CalendarDays size={32} color="#CBD5E1" />
              <Text className="text-slate-400 text-sm mt-2">No events on this day</Text>
            </View>
          ) : (
            <View className="gap-3">
              {dayEvents.map((e) => (
                <View key={e.id} className="flex-row items-center bg-white rounded-2xl p-4 border border-slate-100">
                  <View
                    className="w-1 h-12 rounded-full mr-3"
                    style={{ backgroundColor: typeColors[e.type] }}
                  />
                  <View className="flex-1">
                    <Text className="font-semibold text-slate-800 text-sm">{e.title}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{e.building}</Text>
                  </View>
                  <Badge label={e.type} variant={typeVariant[e.type]} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Upcoming events */}
        <View>
          <Text className="font-bold text-slate-800 mb-3">Upcoming Events</Text>
          <Card padding={false}>
            {EVENTS.slice(0, 4).map((e, i, arr) => (
              <View key={e.id} className={`flex-row items-center px-4 py-3 ${i !== arr.length - 1 ? "border-b border-slate-50" : ""}`}>
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: typeColors[e.type] + "20" }}>
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[e.type] }} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-slate-800">{e.title}</Text>
                  <Text className="text-xs text-slate-400">{formatDate(e.date)}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
