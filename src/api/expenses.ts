import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import { queryKeys } from './periods';
import type { Expense } from '../types';
import { isWithinNextDays } from '../utils/dateUtils';

export function useUpcomingExpenses() {
  return useQuery({
    queryKey: queryKeys.upcomingExpenses,
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: any[]; count: number }>('expenses');
        const expenses = response.data.data;
        
        if (!expenses || !Array.isArray(expenses)) {
          return [];
        }
        
        // Transform and filter expenses within next 3 days
        return expenses
          .map((expense: any) => ({
            id: expense._id,
            name: expense.payee, // Backend uses 'payee' not 'name'
            amount: expense.amount,
            dueDate: expense.dueDate || '',
            dayOfMonth: expense.dayOfMonth,
            periodId: expense.periodId,
            categoryId: expense.category?._id || expense.category,
            paymentSourceId: expense.paymentSource?._id || expense.paymentSource,
          }))
          .filter((expense: any) => isWithinNextDays(expense.dueDate, 3));
      } catch (error) {
        console.error('Error fetching upcoming expenses:', error);
        throw error;
      }
    },
  });
}
