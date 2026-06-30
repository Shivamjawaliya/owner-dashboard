import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingStatus = Database["public"]["Tables"]["bookings"]["Row"]["status"];

export const bookingService = {
  async getAll(ownerId: string) {
    return supabase
      .from("bookings")
      .select("*, buildings(name), rooms(room_number)")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
  },

  async getByStatus(ownerId: string, status: BookingStatus) {
    return supabase
      .from("bookings")
      .select("*, buildings(name), rooms(room_number)")
      .eq("owner_id", ownerId)
      .eq("status", status)
      .order("created_at", { ascending: false });
  },

  async create(data: BookingInsert) {
    return supabase.from("bookings").insert(data).select().single();
  },

  async confirm(id: string) {
    return supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", id)
      .select()
      .single();
  },

  async cancel(id: string) {
    return supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();
  },

  async complete(id: string) {
    return supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", id)
      .select()
      .single();
  },
};
