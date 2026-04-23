import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { Period } from '../types';

export const queryKeys = {
  currentPeriod:     ['currentPeriod'] as const,
  activePeriods:     ['activePeriods'] as const,
  upcomingIncomes:   ['upcomingIncomes'] as const,
  upcomingExpenses:  ['upcomingExpenses'] as const,
  expenseCategories: ['expenseCategories'] as const,
  paymentSources:    ['paymentSources'] as const,
  users:             ['users'] as const,
};

export function useCurrentPeriod() {
  return useQuery({
    queryKey: queryKeys.currentPeriod,
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: Period[]; count: number }>('periods');
        const periods = response.data.data;
        
        if (!periods || !Array.isArray(periods)) {
          return null;
        }
        
        // Find current period: end date >= today, earliest start date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activePeriods = periods.filter(p => new Date(p.endDate) >= today);
        if (activePeriods.length === 0) return null;
        
        // Sort by start date and return the earliest
        activePeriods.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        return activePeriods[0];
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
      const response = await apiClient.get<{ data: any[]; count: number }>('periods');
      const periods = response.data.data;
      
      // Filter active periods: end date >= today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activePeriods = periods.filter(p => new Date(p.endDate) >= today);
      
      // Transform MongoDB structure to frontend structure
      return activePeriods.map((period: any) => ({
        id: period._id,
        startDate: period.startDate,
        endDate: period.endDate,
        incomes: (period.incomes || []).map((entry: any) => ({
          id: entry.income?._id || entry.income,
          name: entry.income?.source || '', // Backend uses 'source' not 'name'
          amount: entry.overrideAmount ?? entry.income?.amount ?? 0,
          scheduledDate: entry.income?.scheduledDate || '',
          dayOfMonth: entry.income?.dayOfMonth || 0,
          periodId: period._id,
        })),
        expenses: (period.expenses || []).map((entry: any) => ({
          id: entry.expense?._id || entry.expense,
          name: entry.expense?.payee || '', // Backend uses 'payee' not 'name'
          amount: entry.overrideAmount ?? entry.expense?.amount ?? 0,
          dueDate: entry.expense?.dueDate || '',
          dayOfMonth: entry.expense?.dayOfMonth || 0,
          periodId: period._id,
          categoryId: entry.expense?.category?._id || entry.expense?.category,
          paymentSourceId: entry.expense?.paymentSource?._id || entry.expense?.paymentSource,
        })),
      }));
    },
  });
}

export function useGeneratePeriods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (count: number) => {
      const response = await apiClient.post<{ data: Period[]; count: number }>(`periods/generate/${count}`);
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
