import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import { queryKeys } from './periods';
import type { Income } from '../types';
import { isWithinNextDays } from '../utils/dateUtils';

export function useUpcomingIncomes() {
  return useQuery({
    queryKey: queryKeys.upcomingIncomes,
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: any[]; count: number }>('incomes');
        const incomes = response.data.data;
        
        if (!incomes || !Array.isArray(incomes)) {
          return [];
        }
        
        // Transform and filter incomes within next 3 days
        return incomes
          .map((income: any) => ({
            id: income._id,
            name: income.source, // Backend uses 'source' not 'name'
            amount: income.amount,
            scheduledDate: income.scheduledDate || '',
            dayOfMonth: income.dayOfMonth,
            periodId: income.periodId,
          }))
          .filter((income: any) => isWithinNextDays(income.scheduledDate, 3));
      } catch (error) {
        console.error('Error fetching upcoming incomes:', error);
        throw error;
      }
    },
  });
}
