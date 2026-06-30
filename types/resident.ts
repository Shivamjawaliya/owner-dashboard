import { Address, Status } from "./common";

export type KycStatus = "pending" | "submitted" | "verified" | "rejected";
export type Gender = "male" | "female" | "other";

export interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dateOfBirth: string;
  gender: Gender;
  avatar?: string;
  occupation: string;
  permanentAddress: Address;
  buildingId: string;
  floorId: string;
  roomId: string;
  bedId: string;
  moveInDate: string;
  moveOutDate?: string;
  monthlyRent: number;
  depositAmount: number;
  kycStatus: KycStatus;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentDocument {
  id: string;
  residentId: string;
  type: "aadhaar" | "pan" | "passport" | "voter_id" | "other";
  url: string;
  status: KycStatus;
  uploadedAt: string;
}
