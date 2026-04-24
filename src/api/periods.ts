import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { Period, PeriodIncomeEntry, PeriodExpenseEntry } from '../types';

export const queryKeys = {
  currentPeriod:     ['currentPeriod'] as const,
  activePeriods:     ['activePeriods'] as const,
  upcomingIncomes:   ['upcomingIncomes'] as const,
  upcomingExpenses:  ['upcomingExpenses'] as const,
  expenseCategories: ['expenseCategories'] as const,
  paymentSources:    ['paymentSources'] as const,
  users:             ['users'] as const,
};

function transformPeriod(period: any): Period {
  return {
    id: period._id,
    startDate: period.startDate,
    endDate: period.endDate,
    incomes: (period.incomes || []).map((entry: any): PeriodIncomeEntry => ({
      incomeId: entry.income?._id || entry.income,
      name: entry.income?.source || '',
      amount: entry.overrideAmount ?? entry.income?.amount ?? 0,
      dayOfMonth: entry.income?.dayOfMonth || 0,
      isReceived: entry.isReceived ?? false,
      overrideAmount: entry.overrideAmount,
    })),
    expenses: (period.expenses || []).map((entry: any): PeriodExpenseEntry => ({
      expenseId: entry.expense?._id || entry.expense,
      name: entry.expense?.payee || '',
      amount: entry.expense?.amount ?? 0,  // always original amount
      dayOfMonth: entry.expense?.dayOfMonth || 0,
      status: entry.status ?? 'Unpaid',
      overrideAmount: entry.overrideAmount,
      paymentSourceId: entry.expense?.paymentSource?._id || entry.expense?.paymentSource,
      isCarryOver: entry.isCarryOver ?? false,
    })),
  };
}

export function useCurrentPeriod() {
  return useQuery({
    queryKey: queryKeys.currentPeriod,
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: any[]; count: number }>('periods');
        const periods = response.data.data;
        if (!periods || !Array.isArray(periods)) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activePeriods = periods.filter(p => new Date(p.endDate) >= today);
        if (activePeriods.length === 0) return null;
        activePeriods.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        return transformPeriod(activePeriods[0]);
      } catch (error) {
        console.error('Error fetching current period:', error);
        throw error;
      }
    },
  });
}

export function useActivePeriods() {
  return useQuery({
    queryKey: queryKeys.activePeriods,
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: any[]; count: number }>('periods');
        const periods = response.data.data;
        if (!periods || !Array.isArray(periods)) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return periods
          .filter(p => new Date(p.endDate) >= today)
          .map(transformPeriod);
      } catch (error) {
        console.error('Error fetching active periods:', error);
        throw error;
      }
    },
  });
}

export function useUpdatePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (period: Period) => {
      const response = await apiClient.put<{ data: any }>(`periods/${period.id}`, {
        startDate: period.startDate,
        endDate: period.endDate,
        incomes: (period.incomes || []).map(e => ({
          income: e.incomeId,
          isReceived: e.isReceived,
          ...(e.overrideAmount !== undefined ? { overrideAmount: e.overrideAmount } : {}),
        })),
        expenses: (period.expenses || []).map(e => ({
          expense: e.expenseId,
          status: e.status,
          ...(e.overrideAmount !== undefined ? { overrideAmount: e.overrideAmount } : {}),
          ...(e.isCarryOver ? { isCarryOver: true } : {}),
        })),
      });
      return transformPeriod(response.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activePeriods });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod });
    },
  });
}

export function useGeneratePeriods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (count: number) => {
      const response = await apiClient.post<{ data: any[]; count: number }>(`periods/generate/${count}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentPeriod });
      queryClient.invalidateQueries({ queryKey: queryKeys.activePeriods });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingIncomes });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingExpenses });
    },
  });
}
