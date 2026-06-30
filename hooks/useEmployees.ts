import { useState, useEffect, useCallback } from "react";
import { employeeService } from "@/services/employee.service";
import { useAuthStore } from "@/store/auth.store";
import type { Tables } from "@/lib/database.types";

type Employee = Tables<"employees"> & { buildings?: { name: string } | null };

export function useEmployees() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll]     = useState(0);
  const [loading, setLoading]     = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [listResult, payrollTotal] = await Promise.all([
      employeeService.getAll(user.id),
      employeeService.getTotalPayroll(user.id),
    ]);
    setEmployees((listResult.data as Employee[]) ?? []);
    setPayroll(payrollTotal);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { employees, payroll, loading, refetch: fetch };
}
