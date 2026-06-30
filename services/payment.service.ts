import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type PaymentStatus = Database["public"]["Tables"]["payments"]["Row"]["status"];
type PaymentMethod = Database["public"]["Tables"]["payments"]["Row"]["method"];

export const paymentService = {
  async getAll(ownerId: string) {
    return supabase
      .from("payments")
      .select("*, residents(name, phone), buildings(name), rooms(room_number)")
      .eq("owner_id", ownerId)
      .order("due_date", { ascending: false });
  },

  async getByStatus(ownerId: string, status: PaymentStatus) {
    return supabase
      .from("payments")
      .select("*, residents(name, phone), rooms(room_number)")
      .eq("owner_id", ownerId)
      .eq("status", status)
      .order("due_date");
  },

  async getOverdue(ownerId: string) {
    const today = new Date().toISOString().split("T")[0];
    return supabase
      .from("payments")
      .select("*, residents(name, phone), rooms(room_number)")
      .eq("owner_id", ownerId)
      .eq("status", "pending")
      .lt("due_date", today);
  },

  async create(data: PaymentInsert) {
    return supabase.from("payments").insert(data).select().single();
  },

  async markPaid(id: string, method: PaymentMethod, paidDate?: string) {
    return supabase
      .from("payments")
      .update({
        status: "paid",
        method,
        paid_date: paidDate ?? new Date().toISOString().split("T")[0],
      })
      .eq("id", id)
      .select()
      .single();
  },

  async getSummary(ownerId: string) {
    const { data } = await supabase
      .from("payments")
      .select("amount, status")
      .eq("owner_id", ownerId);

    const collected = data?.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0) ?? 0;
    const pending   = data?.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0) ?? 0;
    const overdue   = data?.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0) ?? 0;

    return { collected, pending, overdue };
  },

  async bulkCreateMonthlyRent(ownerId: string, month: string) {
    const { data: residents } = await supabase
      .from("residents")
      .select("id, building_id, room_id, monthly_rent")
      .eq("owner_id", ownerId)
      .eq("status", "active");

    if (!residents?.length) return { data: null, error: null };

    const payments: PaymentInsert[] = residents.map((r) => ({
      owner_id:   ownerId,
      resident_id:r.id,
      building_id:r.building_id,
      room_id:    r.room_id,
      type:       "rent",
      amount:     r.monthly_rent,
      due_date:   `${month}-05`,
      status:     "pending",
    }));

    return supabase.from("payments").insert(payments).select();
  },
};
