import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type EmployeeInsert    = Database["public"]["Tables"]["employees"]["Insert"];
type EmployeeUpdate    = Database["public"]["Tables"]["employees"]["Update"];
type AttendanceInsert  = Database["public"]["Tables"]["attendance"]["Insert"];

export const employeeService = {
  async getAll(ownerId: string) {
    return supabase
      .from("employees")
      .select("*, buildings(name)")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
  },

  async getByBuilding(buildingId: string) {
    return supabase
      .from("employees")
      .select("*")
      .eq("building_id", buildingId)
      .eq("status", "active");
  },

  async create(data: EmployeeInsert) {
    return supabase.from("employees").insert(data).select().single();
  },

  async update(id: string, data: EmployeeUpdate) {
    return supabase.from("employees").update(data).eq("id", id).select().single();
  },

  async markAttendance(data: AttendanceInsert) {
    return supabase.from("attendance").upsert(data, { onConflict: "employee_id,date" }).select().single();
  },

  async getAttendance(employeeId: string, month: string) {
    return supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .like("date", `${month}%`);
  },

  async getTotalPayroll(ownerId: string) {
    const { data } = await supabase
      .from("employees")
      .select("salary")
      .eq("owner_id", ownerId)
      .eq("status", "active");
    return data?.reduce((s, e) => s + e.salary, 0) ?? 0;
  },
};
