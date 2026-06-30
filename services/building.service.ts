import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type BuildingInsert = Database["public"]["Tables"]["buildings"]["Insert"];
type BuildingUpdate = Database["public"]["Tables"]["buildings"]["Update"];
type FloorInsert    = Database["public"]["Tables"]["floors"]["Insert"];
type RoomInsert     = Database["public"]["Tables"]["rooms"]["Insert"];

export const buildingService = {
  async getAll(ownerId: string) {
    return supabase
      .from("buildings")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
  },

  async getById(id: string) {
    return supabase.from("buildings").select("*").eq("id", id).single();
  },

  async create(data: BuildingInsert) {
    return supabase.from("buildings").insert(data).select().single();
  },

  async update(id: string, data: BuildingUpdate) {
    return supabase.from("buildings").update(data).eq("id", id).select().single();
  },

  async delete(id: string) {
    return supabase.from("buildings").delete().eq("id", id);
  },

  // Floors
  async getFloors(buildingId: string) {
    return supabase
      .from("floors")
      .select("*, rooms(id, is_occupied:beds(is_occupied))")
      .eq("building_id", buildingId)
      .order("floor_number");
  },

  async addFloor(data: FloorInsert) {
    return supabase.from("floors").insert(data).select().single();
  },

  // Rooms
  async getRooms(buildingId: string, floorId?: string) {
    let query = supabase
      .from("rooms")
      .select("*, beds(*)")
      .eq("building_id", buildingId);
    if (floorId) query = query.eq("floor_id", floorId);
    return query.order("room_number");
  },

  async addRoom(data: RoomInsert) {
    const { data: room, error } = await supabase.from("rooms").insert(data).select().single();
    if (!error && room) {
      const beds = Array.from({ length: room.total_beds }, (_, i) => ({
        room_id:     room.id,
        bed_number:  `Bed ${i + 1}`,
        is_occupied: false,
        resident_id: null as string | null,
      }));
      await supabase.from("beds").insert(beds);
    }
    return { data: room, error };
  },

  async getAvailableBeds(roomId: string) {
    return supabase
      .from("beds")
      .select("*")
      .eq("room_id", roomId)
      .eq("is_occupied", false)
      .order("bed_number");
  },

  async getStats(ownerId: string) {
    const { data: buildings } = await supabase
      .from("buildings")
      .select("id")
      .eq("owner_id", ownerId);

    const { data: rooms } = await supabase
      .from("rooms")
      .select("id, building_id")
      .in("building_id", (buildings ?? []).map((b) => b.id));

    const { data: beds } = await supabase
      .from("beds")
      .select("id, is_occupied, room_id");

    return {
      totalBuildings: buildings?.length ?? 0,
      totalRooms:     rooms?.length ?? 0,
      totalBeds:      beds?.length ?? 0,
      occupiedBeds:   beds?.filter((b) => b.is_occupied).length ?? 0,
    };
  },
};
