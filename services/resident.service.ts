import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type ResidentInsert = Database["public"]["Tables"]["residents"]["Insert"];
type ResidentUpdate = Database["public"]["Tables"]["residents"]["Update"];

export const residentService = {
  async getAll(ownerId: string) {
    return supabase
      .from("residents")
      .select("*, buildings(name), rooms(room_number)")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
  },

  async getById(id: string) {
    return supabase
      .from("residents")
      .select("*, buildings(name), rooms(room_number), beds(bed_number)")
      .eq("id", id)
      .single();
  },

  async getByBuilding(buildingId: string) {
    return supabase
      .from("residents")
      .select("*, rooms(room_number)")
      .eq("building_id", buildingId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
  },

  async create(data: ResidentInsert) {
    const { data: resident, error } = await supabase
      .from("residents")
      .insert(data)
      .select()
      .single();

    if (!error && resident?.bed_id) {
      await supabase
        .from("beds")
        .update({ is_occupied: true, resident_id: resident.id })
        .eq("id", resident.bed_id);
    }
    return { data: resident, error };
  },

  async update(id: string, data: ResidentUpdate) {
    return supabase.from("residents").update(data).eq("id", id).select().single();
  },

  async moveOut(id: string, moveOutDate: string) {
    const { data: resident } = await supabase
      .from("residents")
      .select("bed_id")
      .eq("id", id)
      .single();

    if (resident?.bed_id) {
      await supabase
        .from("beds")
        .update({ is_occupied: false, resident_id: null })
        .eq("id", resident.bed_id);
    }

    return supabase
      .from("residents")
      .update({ status: "inactive", move_out_date: moveOutDate })
      .eq("id", id)
      .select()
      .single();
  },

  async search(ownerId: string, query: string) {
    return supabase
      .from("residents")
      .select("*, buildings(name), rooms(room_number)")
      .eq("owner_id", ownerId)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`);
  },
};
