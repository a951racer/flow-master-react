import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { queryKeys } from './periods';
import type { ExpenseCategory, PaymentSource, User } from '../types';

// ── Expense Categories ────────────────────────────────────────────────────────

export function useExpenseCategories() {
  return useQuery({
    queryKey: queryKeys.expenseCategories,
    queryFn: async () => {
      const response = await apiClient.get<{ data: any[]; count: number }>('expense-categories');
      // Transform backend format { _id, category } to frontend format { id, name }
      return response.data.data.map((item: any) => ({
        id: item._id,
        name: item.category,
      })) as ExpenseCategory[];
    },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post<{ data: any }>('expense-categories', { category: name });
      return {
        id: response.data.data._id,
        name: response.data.data.category,
      } as ExpenseCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories });
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: ExpenseCategory) => {
      // Transform frontend format { id, name } to backend format { category }
      const response = await apiClient.put<{ data: any }>(
        `expense-categories/${category.id}`,
        { category: category.name }
      );
      // Transform response back to frontend format
      return {
        id: response.data.data._id,
        name: response.data.data.category,
      } as ExpenseCategory;
    },
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenseCategories });
      const previous = queryClient.getQueryData<ExpenseCategory[]>(queryKeys.expenseCategories);
      queryClient.setQueryData<ExpenseCategory[]>(queryKeys.expenseCategories, old =>
        old?.map(c => (c.id === updated.id ? updated : c)) ?? []
      );
      return { previous };
    },
    onError: (_err, _updated, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.expenseCategories, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories });
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`expense-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories });
    },
  });
}

// ── Payment Sources ───────────────────────────────────────────────────────────

export function usePaymentSources() {
  return useQuery({
    queryKey: queryKeys.paymentSources,
    queryFn: async () => {
      const response = await apiClient.get<{ data: any[]; count: number }>('payment-sources');
      // Transform backend format { _id, source } to frontend format { id, name }
      return response.data.data.map((item: any) => ({
        id: item._id,
        name: item.source,
      })) as PaymentSource[];
    },
  });
}

export function useCreatePaymentSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post<{ data: any }>('payment-sources', { source: name });
      return {
        id: response.data.data._id,
        name: response.data.data.source,
      } as PaymentSource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentSources });
    },
  });
}

export function useUpdatePaymentSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (source: PaymentSource) => {
      // Transform frontend format { id, name } to backend format { source }
      const response = await apiClient.put<{ data: any }>(
        `payment-sources/${source.id}`,
        { source: source.name }
      );
      // Transform response back to frontend format
      return {
        id: response.data.data._id,
        name: response.data.data.source,
      } as PaymentSource;
    },
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.paymentSources });
      const previous = queryClient.getQueryData<PaymentSource[]>(queryKeys.paymentSources);
      queryClient.setQueryData<PaymentSource[]>(queryKeys.paymentSources, old =>
        old?.map(s => (s.id === updated.id ? updated : s)) ?? []
      );
      return { previous };
    },
    onError: (_err, _updated, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.paymentSources, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentSources });
    },
  });
}

export function useDeletePaymentSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`payment-sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentSources });
    },
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const response = await apiClient.get<{ data: any[]; count: number }>('users');
      return response.data.data.map((item: any) => ({
        id: item._id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
      })) as User[];
    },
  });
}
