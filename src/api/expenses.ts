import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { queryKeys } from './periods';
import type { Expense } from '../types';
import { isWithinNextDays } from '../utils/dateUtils';

const expenseQueryKey = ['allExpenses'] as const;

function transformExpense(expense: any): Expense {
  return {
    id: expense._id,
    name: expense.payee,
    payee: expense.payee,
    amount: expense.amount,
    dueDate: expense.dueDate || '',
    dayOfMonth: expense.dayOfMonth,
    categoryId: expense.category?._id || expense.category || '',
    paymentSourceId: expense.paymentSource?._id || expense.paymentSource || '',
    type: expense.type,
    payeeUrl: expense.payeeUrl,
    required: expense.required,
    inactive: expense.inactive ?? false,
    inactiveDate: expense.inactiveDate,
  };
}

export function useAllExpenses() {
  return useQuery({
    queryKey: expenseQueryKey,
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: any[]; count: number }>('expenses');
        const expenses = response.data.data;
        if (!expenses || !Array.isArray(expenses)) return [];
        return expenses.map(transformExpense);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Expense, 'id' | 'name'>) => {
      const response = await apiClient.post<{ data: any }>('expenses', {
        dayOfMonth: data.dayOfMonth,
        amount: data.amount,
        type: data.type,
        payee: data.payee,
        payeeUrl: data.payeeUrl || undefined,
        required: data.required,
        category: data.categoryId,
        paymentSource: data.paymentSourceId,
        inactive: data.inactive,
        inactiveDate: data.inactiveDate || undefined,
      });
      return transformExpense(response.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingExpenses });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Expense) => {
      const response = await apiClient.put<{ data: any }>(`expenses/${data.id}`, {
        dayOfMonth: data.dayOfMonth,
        amount: data.amount,
        type: data.type,
        payee: data.payee,
        payeeUrl: data.payeeUrl || undefined,
        required: data.required,
        category: data.categoryId,
        paymentSource: data.paymentSourceId,
        inactive: data.inactive,
        inactiveDate: data.inactiveDate || undefined,
      });
      return transformExpense(response.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingExpenses });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingExpenses });
    },
  });
}

export function useUpcomingExpenses() {
  return useQuery({
    queryKey: queryKeys.upcomingExpenses,
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: any[]; count: number }>('expenses');
        const expenses = response.data.data;
        if (!expenses || !Array.isArray(expenses)) return [];
        return expenses
          .map(transformExpense)
          .filter((e) => isWithinNextDays(e.dueDate, 3));
      } catch (error) {
        console.error('Error fetching upcoming expenses:', error);
        throw error;
      }
    },
  });
}
