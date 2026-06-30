import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useState } from "react";
import { CreditCard } from "lucide-react-native";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import SectionHeader from "@/components/common/SectionHeader";
import EmptyState from "@/components/common/EmptyState";
import { formatCurrency, formatDate, getInitials } from "@/utils/format";
import { usePayments } from "@/hooks/usePayments";
import type { Tables } from "@/lib/database.types";

type PaymentStatus = Tables<"payments">["status"];

const badgeMap: Record<PaymentStatus, { variant: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  paid:    { variant: "success", label: "Paid" },
  pending: { variant: "warning", label: "Pending" },
  overdue: { variant: "danger",  label: "Overdue" },
  partial: { variant: "warning", label: "Partial" },
};

export default function PaymentsScreen() {
  const [activeFilter, setActiveFilter] = useState<PaymentStatus | "all">("all");
  const { payments, summary, loading, refetch, markPaid } = usePayments();

  const filtered = activeFilter === "all" ? payments : payments.filter((p) => p.status === activeFilter);

  const SUMMARY_CARDS = [
    { label: "Collected", value: summary.collected, color: "#22C55E", bg: "#F0FDF4" },
    { label: "Pending",   value: summary.pending,   color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Overdue",   value: summary.overdue,   color: "#EF4444", bg: "#FEF2F2" },
  ];

  return (
    <View className="flex-1">
      <Header title="Payments" subtitle={`${payments.length} total`} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View className="px-4 pt-4">
          <View className="flex-row gap-3">
            {SUMMARY_CARDS.map((s) => (
              <View
                key={s.label}
                className="flex-1 rounded-2xl py-4 px-3 items-center border border-slate-100"
                style={{ backgroundColor: s.bg }}
              >
                <Text className="text-xs text-slate-500 mb-1">{s.label}</Text>
                <Text className="font-bold text-base" style={{ color: s.color }}>
                  {formatCurrency(s.value)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {(["all", "paid", "pending", "overdue"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full border ${
                activeFilter === f ? "bg-blue-600 border-blue-600" : "bg-white border-slate-200"
              }`}
            >
              <Text className={`text-sm font-medium capitalize ${activeFilter === f ? "text-white" : "text-slate-600"}`}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Payments list */}
        <View className="px-4 gap-3">
          <SectionHeader title={`${filtered.length} payments`} />
          {loading ? (
            <ActivityIndicator color="#2563EB" />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<CreditCard size={40} color="#94A3B8" />} title="No payments found" />
          ) : (
            filtered.map((p) => {
              const badge = badgeMap[p.status] ?? { variant: "neutral" as const, label: p.status };
              const name = (p as any).residents?.name ?? "Resident";
              return (
                <Card key={p.id}>
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                      <Text className="text-blue-700 font-bold text-xs">{getInitials(name)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-slate-800">{name}</Text>
                      <Text className="text-xs text-slate-400">
                        Room {(p as any).rooms?.room_number ?? "-"}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        Due: {formatDate(p.due_date)}
                        {p.paid_date ? ` · Paid: ${formatDate(p.paid_date)}` : ""}
                        {p.method ? ` · ${p.method}` : ""}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="font-bold text-slate-800">{formatCurrency(p.amount)}</Text>
                      <Badge label={badge.label} variant={badge.variant} />
                    </View>
                  </View>
                  {p.status !== "paid" && (
                    <TouchableOpacity
                      onPress={() => markPaid(p.id, "cash")}
                      className="mt-3 bg-blue-600 rounded-xl py-2 items-center"
                    >
                      <Text className="text-white text-sm font-semibold">Mark as Paid</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })
          )}
        </View>
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
