import React, { useEffect } from 'react';
import { useActivePeriods } from '../api/periods';
import { useNotificationStore } from '../store/notificationStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/dateUtils';
import type { Period } from '../types';

interface PeriodColumnProps {
  period: Period;
}

const PeriodColumn: React.FC<PeriodColumnProps> = ({ period }) => {
  const incomes = period.incomes || [];
  const expenses = period.expenses || [];

  // Calculate summary values client-side
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const difference = totalIncome - totalExpenses;

  // Sort incomes and expenses by dayOfMonth ascending
  const sortedIncomes = [...incomes].sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  const sortedExpenses = [...expenses].sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  return (
    <div className="flex-shrink-0 w-80 bg-white rounded-lg shadow p-4">
      {/* Header: Date Range */}
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        {formatDate(period.startDate)} - {formatDate(period.endDate)}
      </h3>

      {/* Summary Section */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Total Income:</span>
          <span className="text-sm font-semibold text-green-600">${totalIncome.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Total Expenses:</span>
          <span className="text-sm font-semibold text-red-600">${totalExpenses.toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-300">
          <span className="text-sm font-medium text-gray-700">Difference:</span>
          <span className={`text-sm font-bold ${difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ${difference.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Income List */}
      <div className="mb-4">
        <h4 className="text-md font-semibold mb-2 text-gray-700">Incomes</h4>
        {sortedIncomes.length > 0 ? (
          <ul className="space-y-1">
            {sortedIncomes.map(income => (
              <li key={income.id} className="flex justify-between items-center text-sm p-2 bg-green-50 rounded">
                <span className="font-medium">{income.name}</span>
                <span className="text-xs text-gray-500 mx-2">{income.dayOfMonth}</span>
                <span className="text-gray-700">${income.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No incomes</p>
        )}
      </div>

      {/* Expense List */}
      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-700">Expenses</h4>
        {sortedExpenses.length > 0 ? (
          <ul className="space-y-1">
            {sortedExpenses.map(expense => (
              <li key={expense.id} className="flex justify-between items-center text-sm p-2 bg-red-50 rounded">
                <span className="font-medium">{expense.name}</span>
                <span className="text-xs text-gray-500 mx-2">{expense.dayOfMonth}</span>
                <span className="text-gray-700">${expense.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No expenses</p>
        )}
      </div>
    </div>
  );
};

export const PeriodsPage: React.FC = () => {
  const addNotification = useNotificationStore(s => s.add);
  const { data: periods, isLoading, isError } = useActivePeriods();

  // Push notification on fetch error
  useEffect(() => {
    if (isError) {
      addNotification('Failed to load active periods');
    }
  }, [isError, addNotification]);

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Periods</h1>
        <LoadingSpinner />
      </div>
    );
  }

  if (!periods || periods.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Periods</h1>
        <p className="text-gray-500">No active periods available</p>
      </div>
    );
  }

  // Sort periods by startDate ascending (oldest to newest)
  const sortedPeriods = [...periods].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Periods</h1>
      
      {/* Horizontally scrollable container */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4">
          {sortedPeriods.map(period => (
            <PeriodColumn key={period.id} period={period} />
          ))}
        </div>
      </div>
    </div>
  );
};
