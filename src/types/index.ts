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
  id: string;
  name: string;        // mapped from source
  source: string;
  amount: number;
  scheduledDate: string;  // ISO 8601
  dayOfMonth: number;
  periodId?: string;
  isPaycheck: boolean;
  inactive: boolean;
  inactiveDate?: string;
}

export interface Expense {
  id: string;
  name: string;        // mapped from payee
  payee: string;
  amount: number;
  dueDate: string;        // ISO 8601
  dayOfMonth: number;
  periodId?: string;
  categoryId: string;
  paymentSourceId: string;
  type: 'expense' | 'debt' | 'bill';
  payeeUrl?: string;
  required: boolean;
  inactive: boolean;
  inactiveDate?: string;
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
