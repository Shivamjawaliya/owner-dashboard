import { Address, Status } from "./common";

export interface Building {
  id: string;
  name: string;
  address: Address;
  totalFloors: number;
  totalRooms: number;
  occupiedRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  amenities: string[];
  images: string[];
  status: Status;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  floorNumber: number;
  name: string;
  totalRooms: number;
  occupiedRooms: number;
}

export interface Room {
  id: string;
  buildingId: string;
  floorId: string;
  roomNumber: string;
  type: "single" | "double" | "triple" | "dormitory";
  totalBeds: number;
  occupiedBeds: number;
  monthlyRent: number;
  amenities: string[];
  status: Status;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  isOccupied: boolean;
  residentId?: string;
}

export interface BuildingStats {
  totalBuildings: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
}
