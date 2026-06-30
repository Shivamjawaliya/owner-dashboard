export type PaymentType = "rent" | "deposit" | "maintenance" | "other";
export type PaymentStatus = "paid" | "pending" | "overdue" | "partial";
export type PaymentMethod = "cash" | "upi" | "bank_transfer" | "cheque";

export interface Payment {
  id: string;
  residentId: string;
  residentName: string;
  buildingId: string;
  roomId: string;
  type: PaymentType;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentSummary {
  totalCollected: number;
  pending: number;
  overdue: number;
  thisMonth: number;
}
