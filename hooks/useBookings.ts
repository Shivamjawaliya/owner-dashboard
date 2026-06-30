import { useState, useEffect, useCallback } from "react";
import { bookingService } from "@/services/booking.service";
import { useAuthStore } from "@/store/auth.store";
import type { Tables } from "@/lib/database.types";

type Booking = Tables<"bookings"> & {
  buildings?: { name: string } | null;
  rooms?: { room_number: string } | null;
};

export function useBookings() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await bookingService.getAll(user.id);
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function confirm(id: string) {
    const { error } = await bookingService.confirm(id);
    if (!error) setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "confirmed" as const } : b));
    return { error };
  }

  async function cancel(id: string) {
    const { error } = await bookingService.cancel(id);
    if (!error) setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" as const } : b));
    return { error };
  }

  return { bookings, loading, refetch: fetch, confirm, cancel };
}
