import React, { useState, useEffect } from 'react';
import { useCurrentPeriod } from '../api/periods';
import { useUpcomingIncomes } from '../api/incomes';
import { useUpcomingExpenses } from '../api/expenses';
import { useNotificationStore } from '../store/notificationStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CreatePeriodsModal } from '../components/modals/CreatePeriodsModal';
import { formatDate } from '../utils/dateUtils';

export const DashboardPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addNotification = useNotificationStore(s => s.add);

  const currentPeriodQuery = useCurrentPeriod();
  const upcomingIncomesQuery = useUpcomingIncomes();
  const upcomingExpensesQuery = useUpcomingExpenses();

  // Push notifications for fetch errors
  useEffect(() => {
    if (currentPeriodQuery.isError) {
      addNotification('Failed to load current period');
    }
  }, [currentPeriodQuery.isError, addNotification]);

  useEffect(() => {
    if (upcomingIncomesQuery.isError) {
      addNotification('Failed to load upcoming incomes');
    }
  }, [upcomingIncomesQuery.isError, addNotification]);

  useEffect(() => {
    if (upcomingExpensesQuery.isError) {
      addNotification('Failed to load upcoming expenses');
    }
  }, [upcomingExpensesQuery.isError, addNotification]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-white rounded"
          style={{ backgroundColor: '#2F6FB5' }}
        >
          Create Periods
        </button>
      </div>

      {/* Current Period Section */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">Current Period</h2>
        {currentPeriodQuery.isLoading ? (
          <LoadingSpinner />
        ) : currentPeriodQuery.data ? (
          <p className="text-gray-700">
            {formatDate(currentPeriodQuery.data.startDate)} - {formatDate(currentPeriodQuery.data.endDate)}
          </p>
        ) : (
          <p className="text-gray-500">No active period available</p>
        )}
      </section>

      {/* Upcoming Incomes Section */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">Upcoming Incomes (Next 3 Days)</h2>
        {upcomingIncomesQuery.isLoading ? (
          <LoadingSpinner />
        ) : upcomingIncomesQuery.data && upcomingIncomesQuery.data.length > 0 ? (
          <ul className="space-y-2">
            {upcomingIncomesQuery.data.map(income => (
              <li key={income.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{income.name}</span>
                <span className="text-gray-600">{formatDate(income.scheduledDate)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No upcoming incomes</p>
        )}
      </section>

      {/* Upcoming Expenses Section */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">Upcoming Expenses (Next 3 Days)</h2>
        {upcomingExpensesQuery.isLoading ? (
          <LoadingSpinner />
        ) : upcomingExpensesQuery.data && upcomingExpensesQuery.data.length > 0 ? (
          <ul className="space-y-2">
            {upcomingExpensesQuery.data.map(expense => (
              <li key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{expense.name}</span>
                <span className="text-gray-600">{formatDate(expense.dueDate)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No upcoming expenses</p>
        )}
      </section>

      <CreatePeriodsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
