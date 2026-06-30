import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import {
  CalendarCheck2, CheckCircle2, XCircle,
  Clock, Building2, DoorOpen, Banknote,
} from "lucide-react-native";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/common/EmptyState";
import { formatDate, formatCurrency, getInitials } from "@/utils/format";
import { useBookings } from "@/hooks/useBookings";
import type { Tables } from "@/lib/database.types";

type BookingStatus = Tables<"bookings">["status"];

const TABS: { label: string; value: BookingStatus | "all"; color: string }[] = [
  { label: "All",       value: "all",       color: "#2563EB" },
  { label: "Pending",   value: "pending",   color: "#F59E0B" },
  { label: "Confirmed", value: "confirmed", color: "#22C55E" },
  { label: "Completed", value: "completed", color: "#8B5CF6" },
  { label: "Cancelled", value: "cancelled", color: "#EF4444" },
];

const STATUS_STYLE: Record<BookingStatus, { color: string; bg: string; label: string }> = {
  pending:   { color: "#F59E0B", bg: "#FFFBEB", label: "Pending" },
  confirmed: { color: "#22C55E", bg: "#F0FDF4", label: "Confirmed" },
  completed: { color: "#8B5CF6", bg: "#F5F3FF", label: "Completed" },
  cancelled: { color: "#EF4444", bg: "#FEF2F2", label: "Cancelled" },
};

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all");
  const { bookings, loading, refetch, confirm, cancel } = useBookings();

  const filtered = activeTab === "all" ? bookings : bookings.filter((b) => b.status === activeTab);

  const pendingCount   = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  return (
    <View className="flex-1 bg-slate-50">
      <Header title="Bookings" subtitle={`${bookings.length} total`} />

      {/* Stats Row */}
      <View className="flex-row px-4 pt-4 pb-3 gap-3">
        {[
          { label: "Pending",   count: pendingCount,   color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Confirmed", count: confirmedCount, color: "#22C55E", bg: "#F0FDF4" },
          { label: "Completed", count: completedCount, color: "#8B5CF6", bg: "#F5F3FF" },
        ].map((s) => (
          <TouchableOpacity
            key={s.label}
            onPress={() => setActiveTab(s.label.toLowerCase() as BookingStatus)}
            className="flex-1 rounded-2xl py-3 items-center border border-transparent"
            style={{ backgroundColor: s.bg }}
          >
            <Text className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</Text>
            <Text className="text-xs font-medium mt-0.5" style={{ color: s.color + "CC" }}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
      >
        {TABS.map((tab) => {
          const count  = tab.value === "all" ? bookings.length : bookings.filter((b) => b.status === tab.value).length;
          const active = activeTab === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              className="flex-row items-center gap-1.5 px-4 py-1.5 rounded-full border"
              style={
                active
                  ? { backgroundColor: tab.color, borderColor: tab.color }
                  : { backgroundColor: "#fff", borderColor: "#E2E8F0" }
              }
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: active ? "#fff" : "#64748B" }}
              >
                {tab.label}
              </Text>
              <View
                className="rounded-full px-1.5 py-0.5 min-w-[20px] items-center"
                style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : "#F1F5F9" }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: active ? "#fff" : "#64748B" }}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color="#2563EB" size="large" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck2 size={40} color="#94A3B8" />}
            title="No bookings"
            description="No bookings match the selected filter"
          />
        ) : (
          filtered.map((b) => {
            const st = STATUS_STYLE[b.status];
            return (
              <Card key={b.id} style={{ borderLeftWidth: 4, borderLeftColor: st.color }}>
                {/* Resident row */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className="w-11 h-11 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: st.color + "20" }}
                    >
                      <Text className="font-bold text-sm" style={{ color: st.color }}>
                        {getInitials(b.resident_name)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-slate-800 text-sm">{b.resident_name}</Text>
                      <Text className="text-xs text-slate-400 mt-0.5">{b.resident_phone}</Text>
                    </View>
                  </View>
                  <View
                    className="px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: st.bg }}
                  >
                    <Text className="text-xs font-bold" style={{ color: st.color }}>{st.label}</Text>
                  </View>
                </View>

                {/* Info grid */}
                <View className="flex-row flex-wrap gap-2 mb-3">
                  <View className="flex-row items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-2">
                    <Building2 size={12} color="#94A3B8" />
                    <Text className="text-xs text-slate-600 font-medium">
                      {(b as any).buildings?.name ?? "-"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-2">
                    <DoorOpen size={12} color="#94A3B8" />
                    <Text className="text-xs text-slate-600 font-medium">
                      Room #{(b as any).rooms?.room_number ?? "-"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-2">
                    <Clock size={12} color="#94A3B8" />
                    <Text className="text-xs text-slate-600 font-medium">
                      {formatDate(b.check_in_date)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-2">
                    <Banknote size={12} color="#94A3B8" />
                    <Text className="text-xs text-slate-600 font-medium">
                      {formatCurrency(b.monthly_rent)}/mo · {formatCurrency(b.deposit_amount)} dep
                    </Text>
                  </View>
                </View>

                {/* Actions for pending */}
                {b.status === "pending" && (
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => confirm(b.id)}
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border"
                      style={{ backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }}
                    >
                      <CheckCircle2 size={14} color="#16A34A" />
                      <Text className="text-sm font-semibold text-green-700">Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => cancel(b.id)}
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border"
                      style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
                    >
                      <XCircle size={14} color="#DC2626" />
                      <Text className="text-sm font-semibold text-red-700">Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
