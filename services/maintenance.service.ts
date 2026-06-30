import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type TicketInsert = Database["public"]["Tables"]["maintenance_tickets"]["Insert"];
type TicketStatus = Database["public"]["Tables"]["maintenance_tickets"]["Row"]["status"];

export const maintenanceService = {
  async getAll(ownerId: string) {
    return supabase
      .from("maintenance_tickets")
      .select("*, buildings(name), rooms(room_number)")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
  },

  async getByStatus(ownerId: string, status: TicketStatus) {
    return supabase
      .from("maintenance_tickets")
      .select("*, buildings(name), rooms(room_number)")
      .eq("owner_id", ownerId)
      .eq("status", status)
      .order("created_at", { ascending: false });
  },

  async create(data: TicketInsert) {
    return supabase.from("maintenance_tickets").insert(data).select().single();
  },

  async updateStatus(id: string, status: TicketStatus) {
    const update: Record<string, string> = { status };
    if (status === "resolved") update.resolved_at = new Date().toISOString();
    return supabase.from("maintenance_tickets").update(update).eq("id", id).select().single();
  },

  async assign(id: string, employeeId: string) {
    return supabase
      .from("maintenance_tickets")
      .update({ assigned_to: employeeId, status: "in_progress" })
      .eq("id", id)
      .select()
      .single();
  },

  async getOpenCount(ownerId: string) {
    const { count } = await supabase
      .from("maintenance_tickets")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .eq("status", "open");
    return count ?? 0;
  },
};
