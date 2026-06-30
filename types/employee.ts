import { Status } from "./common";

export type EmployeeRole = "manager" | "security" | "cleaner" | "electrician" | "plumber" | "cook" | "other";

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: EmployeeRole;
  buildingId: string;
  salary: number;
  joiningDate: string;
  avatar?: string;
  status: Status;
  createdAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "present" | "absent" | "half_day" | "leave";
}
