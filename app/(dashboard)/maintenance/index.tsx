import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Wrench, Plus, AlertCircle, CheckCircle2, Clock } from "lucide-react-native";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/common/EmptyState";
import { formatDate, getInitials } from "@/utils/format";
import { useMaintenance } from "@/hooks/useMaintenance";
import type { Tables } from "@/lib/database.types";

type TicketStatus = Tables<"maintenance_tickets">["status"];
type Priority = Tables<"maintenance_tickets">["priority"];

const statusMap: Record<TicketStatus, { variant: "danger" | "warning" | "success"; label: string }> = {
  open:        { variant: "danger",  label: "Open" },
  in_progress: { variant: "warning", label: "In Progress" },
  resolved:    { variant: "success", label: "Resolved" },
};
const priorityMap: Record<Priority, { color: string; label: string }> = {
  high:   { color: "#EF4444", label: "High" },
  medium: { color: "#F59E0B", label: "Medium" },
  low:    { color: "#22C55E", label: "Low" },
};

export default function MaintenanceScreen() {
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const { tickets, openCount, loading, refetch, updateStatus } = useMaintenance();

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <View className="flex-1">
      <Header
        title="Maintenance"
        subtitle={`${openCount} open tickets`}
        rightAction={
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/maintenance/add" as never)}
            className="flex-row items-center bg-blue-600 px-3 py-2 rounded-xl gap-1"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-sm font-semibold">New</Text>
          </TouchableOpacity>
        }
      />

      {/* Filter bar */}
      <View className="flex-row px-4 py-3 bg-white border-b border-slate-100 gap-3">
        {(["all", "open", "in_progress", "resolved"] as const).map((f) => {
          const count = f === "all" ? tickets.length : tickets.filter((t) => t.status === f).length;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`flex-1 items-center py-2 rounded-xl border ${
                filter === f ? "bg-blue-600 border-blue-600" : "bg-slate-50 border-slate-100"
              }`}
            >
              <Text className={`text-sm font-bold ${filter === f ? "text-white" : "text-slate-700"}`}>{count}</Text>
              <Text className={`text-xs mt-0.5 capitalize ${filter === f ? "text-blue-100" : "text-slate-400"}`}>
                {f.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color="#2563EB" className="mt-8" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Wrench size={40} color="#94A3B8" />} title="No tickets found" />
        ) : (
          filtered.map((ticket) => {
            const { variant, label } = statusMap[ticket.status];
            const { color: pColor, label: pLabel } = priorityMap[ticket.priority];
            return (
              <Card key={ticket.id}>
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-3">
                    <Text className="font-semibold text-slate-800 text-sm">{ticket.title}</Text>
                    <View className="flex-row items-center mt-0.5 gap-2">
                      <Text className="text-xs text-slate-400">
                        Room {(ticket as any).rooms?.room_number ?? "-"}
                      </Text>
                      <Text className="text-slate-200">·</Text>
                      <Text className="text-xs text-slate-400">
                        {(ticket as any).buildings?.name ?? "-"}
                      </Text>
                    </View>
                  </View>
                  <Badge label={label} variant={variant} />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center">
                      <Text className="text-slate-600 text-xs font-bold">
                        {ticket.reported_by ? getInitials(ticket.reported_by) : "?"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs text-slate-600">{ticket.reported_by ?? "Unknown"}</Text>
                      <Text className="text-xs text-slate-400">{formatDate(ticket.created_at)}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: pColor + "15" }}
                    >
                      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pColor }} />
                      <Text className="text-xs font-semibold" style={{ color: pColor }}>{pLabel}</Text>
                    </View>
                    <View className="px-2 py-0.5 bg-slate-100 rounded-full">
                      <Text className="text-xs text-slate-500">{ticket.category}</Text>
                    </View>
                  </View>
                </View>

                {ticket.status !== "resolved" && (
                  <TouchableOpacity
                    onPress={() => updateStatus(ticket.id, ticket.status === "open" ? "in_progress" : "resolved")}
                    className="mt-3 bg-blue-50 border border-blue-100 rounded-xl py-2 items-center"
                  >
                    <Text className="text-blue-600 text-sm font-semibold">
                      {ticket.status === "open" ? "Assign & Start" : "Mark Resolved"}
                    </Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          })
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
