import { useState, useEffect, useCallback } from "react";
import { residentService } from "@/services/resident.service";
import { useAuthStore } from "@/store/auth.store";
import type { Tables } from "@/lib/database.types";

type Resident = Tables<"residents"> & {
  buildings?: { name: string } | null;
  rooms?: { room_number: string } | null;
};

export function useResidents() {
  const { user } = useAuthStore();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await residentService.getAll(user.id);
    if (err) setError(err.message);
    else setResidents((data as Resident[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function createResident(payload: Tables<"residents">["Insert" extends keyof Tables<"residents"> ? "Insert" : never]) {
    const { data, error: err } = await residentService.create(payload as any);
    if (!err) fetch();
    return { data, error: err };
  }

  async function moveOut(id: string) {
    const moveOutDate = new Date().toISOString().split("T")[0];
    const { data, error: err } = await residentService.moveOut(id, moveOutDate);
    if (!err) setResidents((prev) => prev.map((r) => r.id === id ? { ...r, status: "inactive" as const } : r));
    return { data, error: err };
  }

  return { residents, loading, error, refetch: fetch, createResident, moveOut };
}

export function useResident(id: string) {
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    residentService.getById(id).then(({ data }) => {
      setResident(data as Resident);
      setLoading(false);
    });
  }, [id]);

  return { resident, loading };
}
