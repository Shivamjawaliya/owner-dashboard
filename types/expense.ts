export type ExpenseCategory =
  | "electricity"
  | "water"
  | "internet"
  | "salary"
  | "maintenance"
  | "other";

export interface Expense {
  id: string;
  buildingId: string;
  buildingName: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: string;
  receipt?: string;
  notes?: string;
  addedBy: string;
  createdAt: string;
}

export interface ExpenseSummary {
  total: number;
  byCategory: Record<ExpenseCategory, number>;
  thisMonth: number;
  lastMonth: number;
}
