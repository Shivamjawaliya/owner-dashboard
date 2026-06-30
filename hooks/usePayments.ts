import { useState, useEffect, useCallback } from "react";
import { paymentService } from "@/services/payment.service";
import { useAuthStore } from "@/store/auth.store";
import type { Tables } from "@/lib/database.types";

type Payment = Tables<"payments"> & {
  residents?: { name: string; phone: string } | null;
  rooms?: { room_number: string } | null;
};

export function usePayments(statusFilter?: Tables<"payments">["Row"]["status"]) {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary]   = useState({ collected: 0, pending: 0, overdue: 0 });
  const [loading, setLoading]   = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [listResult, summaryResult] = await Promise.all([
      statusFilter
        ? paymentService.getByStatus(user.id, statusFilter)
        : paymentService.getAll(user.id),
      paymentService.getSummary(user.id),
    ]);
    setPayments((listResult.data as Payment[]) ?? []);
    setSummary(summaryResult);
    setLoading(false);
  }, [user, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  async function markPaid(id: string, method: Tables<"payments">["Row"]["method"]) {
    const { data, error } = await paymentService.markPaid(id, method);
    if (!error) setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "paid" as const, method } : p));
    return { data, error };
  }

  return { payments, summary, loading, refetch: fetch, markPaid };
}
