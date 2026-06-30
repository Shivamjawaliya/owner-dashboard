import { useState, useEffect, useCallback } from "react";
import { expenseService } from "@/services/expense.service";
import { useAuthStore } from "@/store/auth.store";
import type { Tables, Database } from "@/lib/database.types";

type Expense  = Tables<"expenses"> & { buildings?: { name: string } | null };
type Category = Database["public"]["Tables"]["expenses"]["Row"]["category"];

export function useExpenses() {
  const { user } = useAuthStore();
  const [expenses, setExpenses]         = useState<Expense[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<Partial<Record<Category, number>>>({});
  const [loading, setLoading]           = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [listResult, totalsResult] = await Promise.all([
      expenseService.getAll(user.id),
      expenseService.getCategoryTotals(user.id),
    ]);
    setExpenses((listResult.data as Expense[]) ?? []);
    setCategoryTotals(totalsResult);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function createExpense(payload: Tables<"expenses">["Insert" extends keyof Tables<"expenses"> ? never : never]) {
    const { data, error } = await expenseService.create(payload as any);
    if (!error) fetch();
    return { data, error };
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return { expenses, categoryTotals, total, loading, refetch: fetch, createExpense };
}
