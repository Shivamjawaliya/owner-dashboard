export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  residentId: string;
  residentName: string;
  buildingId: string;
  buildingName: string;
  roomId: string;
  roomNumber: string;
  bedId?: string;
  checkInDate: string;
  checkOutDate?: string;
  monthlyRent: number;
  depositAmount: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
