export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          avatar_url: string | null;
          role: "owner" | "manager" | "staff";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      buildings: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          pincode: string;
          total_floors: number;
          amenities: string[];
          images: string[];
          status: "active" | "inactive";
          latitude: number | null;
          longitude: number | null;
          maps_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["buildings"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["buildings"]["Insert"]>;
      };
      floors: {
        Row: {
          id: string;
          building_id: string;
          floor_number: number;
          name: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["floors"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["floors"]["Insert"]>;
      };
      rooms: {
        Row: {
          id: string;
          building_id: string;
          floor_id: string;
          room_number: string;
          type: "single" | "double" | "triple" | "dormitory";
          total_beds: number;
          monthly_rent: number;
          amenities: string[];
          images: string[];
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["rooms"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["rooms"]["Insert"]>;
      };
      beds: {
        Row: {
          id: string;
          room_id: string;
          bed_number: string;
          is_occupied: boolean;
          resident_id: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["beds"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["beds"]["Insert"]>;
      };
      residents: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          email: string | null;
          phone: string;
          alternate_phone: string | null;
          date_of_birth: string | null;
          gender: "male" | "female" | "other" | null;
          occupation: string | null;
          building_id: string;
          floor_id: string | null;
          room_id: string;
          bed_id: string | null;
          move_in_date: string;
          move_out_date: string | null;
          monthly_rent: number;
          deposit_amount: number;
          kyc_status: "pending" | "submitted" | "verified" | "rejected";
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relation: string | null;
          status: "active" | "inactive";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["residents"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["residents"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          owner_id: string;
          resident_id: string | null;
          resident_name: string;
          resident_phone: string;
          building_id: string;
          room_id: string;
          bed_id: string | null;
          check_in_date: string;
          check_out_date: string | null;
          monthly_rent: number;
          deposit_amount: number;
          status: "pending" | "confirmed" | "cancelled" | "completed";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bookings"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          owner_id: string;
          resident_id: string;
          building_id: string;
          room_id: string;
          type: "rent" | "deposit" | "maintenance" | "other";
          amount: number;
          due_date: string;
          paid_date: string | null;
          status: "paid" | "pending" | "overdue" | "partial";
          method: "cash" | "upi" | "bank_transfer" | "cheque" | null;
          receipt_number: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      expenses: {
        Row: {
          id: string;
          owner_id: string;
          building_id: string;
          category: "electricity" | "water" | "internet" | "salary" | "maintenance" | "other";
          title: string;
          amount: number;
          date: string;
          receipt_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["expenses"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
      };
      employees: {
        Row: {
          id: string;
          owner_id: string;
          building_id: string | null;
          name: string;
          phone: string;
          email: string | null;
          role: "manager" | "security" | "cleaner" | "electrician" | "plumber" | "cook" | "other";
          salary: number;
          joining_date: string;
          avatar_url: string | null;
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["employees"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
      };
      maintenance_tickets: {
        Row: {
          id: string;
          owner_id: string;
          building_id: string;
          room_id: string | null;
          title: string;
          description: string | null;
          category: string;
          priority: "high" | "medium" | "low";
          status: "open" | "in_progress" | "resolved";
          reported_by: string | null;
          assigned_to: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["maintenance_tickets"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["maintenance_tickets"]["Insert"]>;
      };
    };
      attendance: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: "present" | "absent" | "half_day" | "leave";
        };
        Insert: Omit<Database["public"]["Tables"]["attendance"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
