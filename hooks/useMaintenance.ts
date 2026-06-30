import { useState, useEffect, useCallback } from "react";
import { maintenanceService } from "@/services/maintenance.service";
import { useAuthStore } from "@/store/auth.store";
import type { Tables } from "@/lib/database.types";

type Ticket = Tables<"maintenance_tickets"> & {
  buildings?: { name: string } | null;
  rooms?: { room_number: string } | null;
};

export function useMaintenance() {
  const { user } = useAuthStore();
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await maintenanceService.getAll(user.id);
    setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function updateStatus(id: string, status: Tables<"maintenance_tickets">["Row"]["status"]) {
    const { error } = await maintenanceService.updateStatus(id, status);
    if (!error) setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    return { error };
  }

  const openCount = tickets.filter((t) => t.status === "open").length;

  return { tickets, openCount, loading, refetch: fetch, updateStatus };
}
