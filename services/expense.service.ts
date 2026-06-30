import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type ExpenseInsert   = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseCategory = Database["public"]["Tables"]["expenses"]["Row"]["category"];

export const expenseService = {
  async getAll(ownerId: string) {
    return supabase
      .from("expenses")
      .select("*, buildings(name)")
      .eq("owner_id", ownerId)
      .order("date", { ascending: false });
  },

  async getByBuilding(buildingId: string) {
    return supabase
      .from("expenses")
      .select("*")
      .eq("building_id", buildingId)
      .order("date", { ascending: false });
  },

  async getByCategory(ownerId: string, category: ExpenseCategory) {
    return supabase
      .from("expenses")
      .select("*, buildings(name)")
      .eq("owner_id", ownerId)
      .eq("category", category)
      .order("date", { ascending: false });
  },

  async getByMonth(ownerId: string, year: number, month: number) {
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to   = `${year}-${String(month).padStart(2, "0")}-31`;
    return supabase
      .from("expenses")
      .select("*, buildings(name)")
      .eq("owner_id", ownerId)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false });
  },

  async create(data: ExpenseInsert) {
    return supabase.from("expenses").insert(data).select().single();
  },

  async delete(id: string) {
    return supabase.from("expenses").delete().eq("id", id);
  },

  async getCategoryTotals(ownerId: string) {
    const { data } = await supabase
      .from("expenses")
      .select("category, amount")
      .eq("owner_id", ownerId);

    const totals: Partial<Record<ExpenseCategory, number>> = {};
    data?.forEach((e) => {
      totals[e.category] = (totals[e.category] ?? 0) + e.amount;
    });
    return totals;
  },
};
