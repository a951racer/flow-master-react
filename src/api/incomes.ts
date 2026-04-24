import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { queryKeys } from './periods';
import type { Income } from '../types';
import { isWithinNextDays, isDayOfMonthWithinNextDays } from '../utils/dateUtils';

const incomeQueryKey = ['allIncomes'] as const;

function transformIncome(income: any): Income {
  return {
    id: income._id,
    name: income.source,
    source: income.source,
    amount: income.amount,
    scheduledDate: income.scheduledDate || '',
    dayOfMonth: income.dayOfMonth,
    isPaycheck: income.isPaycheck ?? false,
    inactive: income.inactive ?? false,
    inactiveDate: income.inactiveDate,
  };
}

export function useAllIncomes() {
  return useQuery({
    queryKey: incomeQueryKey,
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: any[]; count: number }>('incomes');
        const incomes = response.data.data;
        if (!incomes || !Array.isArray(incomes)) return [];
        return incomes.map(transformIncome);
      } catch (error) {
        console.error('Error fetching incomes:', error);
        throw error;
      }
    },
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Income, 'id' | 'name'>) => {
      const response = await apiClient.post<{ data: any }>('incomes', {
        dayOfMonth: data.dayOfMonth,
        amount: data.amount,
        source: data.source,
        isPaycheck: data.isPaycheck,
        inactive: data.inactive,
        inactiveDate: data.inactiveDate || undefined,
      });
      return transformIncome(response.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingIncomes });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Income) => {
      const response = await apiClient.put<{ data: any }>(`incomes/${data.id}`, {
        dayOfMonth: data.dayOfMonth,
        amount: data.amount,
        source: data.source,
        isPaycheck: data.isPaycheck,
        inactive: data.inactive,
        inactiveDate: data.inactiveDate || undefined,
      });
      return transformIncome(response.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingIncomes });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`incomes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingIncomes });
    },
  });
}

export function useUpcomingIncomes() {
  return useQuery({
    queryKey: queryKeys.upcomingIncomes,
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: any[]; count: number }>('incomes');
        const incomes = response.data.data;
        if (!incomes || !Array.isArray(incomes)) return [];
        return incomes
          .map(transformIncome)
          .filter((i) => isDayOfMonthWithinNextDays(i.dayOfMonth, 3));
      } catch (error) {
        console.error('Error fetching upcoming incomes:', error);
        throw error;
      }
    },
  });
}
