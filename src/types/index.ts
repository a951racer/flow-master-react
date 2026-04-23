export interface AuthResponse {
  token: string;
}

export interface Period {
  id: number;
  startDate: string;   // ISO 8601 date string
  endDate: string;
  incomes?: Income[];
  expenses?: Expense[];
}

export interface Income {
  id: number;
  name: string;
  amount: number;
  scheduledDate: string;  // ISO 8601
  dayOfMonth: number;
  periodId: number;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  dueDate: string;        // ISO 8601
  dayOfMonth: number;
  periodId: number;
  categoryId?: number;
  paymentSourceId?: number;
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface PaymentSource {
  id: number;
  name: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Notification {
  id: string;           // uuid
  message: string;
}
