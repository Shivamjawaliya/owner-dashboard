import { useState, useEffect, useCallback } from "react";
import { buildingService } from "@/services/building.service";
import { useAuthStore } from "@/store/auth.store";
import type { Tables } from "@/lib/database.types";

type Building = Tables<"buildings">;

export function useBuildings() {
  const { user } = useAuthStore();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await buildingService.getAll(user.id);
    if (err) setError(err.message);
    else setBuildings(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function createBuilding(payload: Omit<Tables<"buildings">, "id" | "created_at" | "updated_at">) {
    const { data, error: err } = await buildingService.create(payload);
    if (!err && data) setBuildings((prev) => [data, ...prev]);
    return { data, error: err };
  }

  async function deleteBuilding(id: string) {
    const { error: err } = await buildingService.delete(id);
    if (!err) setBuildings((prev) => prev.filter((b) => b.id !== id));
    return { error: err };
  }

  return { buildings, loading, error, refetch: fetch, createBuilding, deleteBuilding };
}

export function useBuilding(id: string) {
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    buildingService.getById(id).then(({ data }) => {
      setBuilding(data);
      setLoading(false);
    });
  }, [id]);

  return { building, loading };
}

export function useFloors(buildingId: string) {
  const [floors, setFloors]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    const { data } = await buildingService.getFloors(buildingId);
    setFloors(data ?? []);
    setLoading(false);
  }, [buildingId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addFloor(floorNumber: number, name: string) {
    const { data, error } = await buildingService.addFloor({
      building_id:  buildingId,
      floor_number: floorNumber,
      name,
    });
    if (!error && data) setFloors((prev) => [...prev, data].sort((a, b) => a.floor_number - b.floor_number));
    return { data, error };
  }

  return { floors, loading, refetch: fetch, addFloor };
}

export function useRooms(buildingId: string, floorId?: string) {
  const [rooms, setRooms]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    const { data } = await buildingService.getRooms(buildingId, floorId);
    setRooms(data ?? []);
    setLoading(false);
  }, [buildingId, floorId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addRoom(payload: {
    floor_id?: string;
    room_number: string;
    type: "single" | "double" | "triple" | "dormitory";
    total_beds: number;
    monthly_rent: number;
    amenities: string[];
    status: "active" | "inactive";
  }) {
    const { data, error } = await buildingService.addRoom({
      building_id: buildingId,
      ...payload,
    });
    if (!error && data) setRooms((prev) => [...prev, data]);
    return { data, error };
  }

  return { rooms, loading, refetch: fetch, addRoom };
}
