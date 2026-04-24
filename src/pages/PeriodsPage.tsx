import React, { useEffect, useState } from 'react';
import { useActivePeriods, useUpdatePeriod } from '../api/periods';
import { useNotificationStore } from '../store/notificationStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CreatePeriodsModal } from '../components/modals/CreatePeriodsModal';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import type { Period, PeriodIncomeEntry, PeriodExpenseEntry } from '../types';

const EXPENSE_STATUSES = ['Unpaid', 'Paid', 'Deferred'] as const;

// ── Expense Edit Modal ────────────────────────────────────────────────────────

interface ExpenseEditModalProps {
  expense: PeriodExpenseEntry;
  onSave: (status: PeriodExpenseEntry['status'], overrideAmount: number | undefined) => void;
  onCancel: () => void;
  isPending: boolean;
}

const ExpenseEditModal: React.FC<ExpenseEditModalProps> = ({ expense, onSave, onCancel, isPending }) => {
  const [status, setStatus] = useState<PeriodExpenseEntry['status']>(expense.status);
  const [overrideAmount, setOverrideAmount] = useState(
    expense.overrideAmount !== undefined ? String(expense.overrideAmount) : ''
  );
  const addNotification = useNotificationStore(s => s.add);

  const handleSave = () => {
    const raw = overrideAmount.trim();
    const parsed = raw === '' ? undefined : parseFloat(raw);
    if (raw !== '' && (isNaN(parsed!) || parsed! <= 0)) {
      addNotification('Override amount must be a positive number');
      return;
    }
    onSave(status, parsed);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-80 z-10">
        <h3 className="text-lg font-semibold mb-1 text-gray-800">{expense.name}</h3>
        <p className="text-sm text-gray-500 mb-4">{formatCurrency(expense.amount)}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex gap-4">
            {EXPENSE_STATUSES.map(s => (
              <label key={s} className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name="expense-status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                  className="cursor-pointer"
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Override Amount</label>
          <input
            type="number"
            value={overrideAmount}
            onChange={e => setOverrideAmount(e.target.value)}
            placeholder="Leave blank to use default"
            className="w-full border rounded px-3 py-2 text-sm text-right"
            min={0}
            step={0.01}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={isPending}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isPending}
            className="px-4 py-2 text-sm text-white rounded disabled:opacity-50"
            style={{ backgroundColor: '#2F6FB5' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Period Column ─────────────────────────────────────────────────────────────

interface PeriodColumnProps {
  period: Period;
  onExpenseSave: (
    periodId: string,
    expenseId: string,
    status: PeriodExpenseEntry['status'],
    overrideAmount: number | undefined,
    prevStatus: PeriodExpenseEntry['status']
  ) => void;
  isPending: boolean;
}

const PeriodColumn: React.FC<PeriodColumnProps> = ({ period, onExpenseSave, isPending }) => {
  const updateMutation = useUpdatePeriod();
  const addNotification = useNotificationStore(s => s.add);

  const [incomes, setIncomes] = useState<PeriodIncomeEntry[]>(period.incomes || []);
  const [expenses, setExpenses] = useState<PeriodExpenseEntry[]>(period.expenses || []);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  useEffect(() => { setIncomes(period.incomes || []); }, [period.incomes]);
  useEffect(() => { setExpenses(period.expenses || []); }, [period.expenses]);

  const handleIsReceivedChange = (incomeId: string, value: boolean) => {
    const updated = incomes.map(i => i.incomeId === incomeId ? { ...i, isReceived: value } : i);
    setIncomes(updated);
    updateMutation.mutate(
      { ...period, incomes: updated, expenses },
      { onError: () => addNotification('Failed to update period') }
    );
  };

  const handleExpenseSaveLocal = (
    expenseId: string,
    status: PeriodExpenseEntry['status'],
    overrideAmount: number | undefined
  ) => {
    const expense = expenses.find(e => e.expenseId === expenseId);
    if (!expense) return;
    const prevStatus = expense.status;
    const updated = expenses.map(e =>
      e.expenseId === expenseId ? { ...e, status, overrideAmount } : e
    );
    setExpenses(updated);
    setEditingExpenseId(null);
    onExpenseSave(period.id, expenseId, status, overrideAmount, prevStatus);
  };

  const sortedIncomes = [...incomes].sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  const sortedExpenses = [...expenses].sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  const totalIncome = incomes.reduce((sum, i) => sum + (i.overrideAmount ?? i.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) =>
    sum + (e.status === 'Deferred' ? 0 : (e.overrideAmount ?? e.amount)), 0);
  const difference = totalIncome - totalExpenses;

  const editingExpense = expenses.find(e => e.expenseId === editingExpenseId) ?? null;

  return (
    <div className="flex-shrink-0 w-96 bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{formatDate(period.startDate)}</h3>

      {/* Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Total Income:</span>
          <span className="text-sm font-semibold text-green-600">{formatCurrency(totalIncome)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Total Expenses:</span>
          <span className="text-sm font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-300">
          <span className="text-sm font-medium text-gray-700">Difference:</span>
          <span className={`text-sm font-bold ${difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(difference)}
          </span>
        </div>
      </div>

      {/* Income List */}
      <div className="mb-4">
        <h4 className="text-md font-semibold mb-2 text-gray-700">Incomes</h4>
        {sortedIncomes.length > 0 ? (
          <ul className="space-y-2">
            {sortedIncomes.map(income => (
              <li key={income.incomeId} className="text-sm p-2 bg-green-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{income.name}</span>
                  <span className="text-xs text-gray-500 mx-2">{income.dayOfMonth}</span>
                  <span className="text-gray-700">{formatCurrency(income.overrideAmount ?? income.amount)}</span>
                  <input
                    type="checkbox"
                    checked={income.isReceived}
                    onChange={e => handleIsReceivedChange(income.incomeId, e.target.checked)}
                    className="w-4 h-4 cursor-pointer ml-2"
                    disabled={isPending}
                  />
                </div>
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
          <ul className="space-y-2">
            {sortedExpenses.map(expense => (
              <li key={`${expense.expenseId}-${expense.isCarryOver ? 'carry' : 'orig'}`}
                className="text-sm p-2 bg-red-50 rounded">
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${expense.status === 'Paid' || expense.status === 'Deferred' ? 'line-through opacity-60' : ''}`}>
                    {expense.isCarryOver ? `↩ ${expense.name}` : expense.name}
                  </span>
                  <span className={`text-xs text-gray-500 mx-2 ${expense.status === 'Paid' || expense.status === 'Deferred' ? 'line-through opacity-60' : ''}`}>
                    {expense.dayOfMonth}
                  </span>
                  <span
                    className={`font-medium ${
                      expense.status === 'Deferred' ? 'text-red-600' :
                      expense.isCarryOver ? 'text-red-600' :
                      expense.overrideAmount !== undefined ? 'text-blue-600' :
                      'text-gray-700'
                    } ${expense.status === 'Paid' || expense.status === 'Deferred' ? 'line-through opacity-60' : ''}`}
                    title={
                      expense.status === 'Deferred' || expense.overrideAmount !== undefined
                        ? `Original: ${formatCurrency(expense.amount)}`
                        : undefined
                    }
                  >
                    {expense.status === 'Deferred' ? formatCurrency(0) : formatCurrency(expense.overrideAmount ?? expense.amount)}
                  </span>
                  {/* Only show pencil for non-carry-over expenses */}
                  {!expense.isCarryOver && (
                    <button
                      onClick={() => setEditingExpenseId(expense.expenseId)}
                      className="ml-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit status / override"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No expenses</p>
        )}
      </div>

      {editingExpense && (
        <ExpenseEditModal
          expense={editingExpense}
          onSave={(status, overrideAmount) => handleExpenseSaveLocal(editingExpense.expenseId, status, overrideAmount)}
          onCancel={() => setEditingExpenseId(null)}
          isPending={isPending}
        />
      )}
    </div>
  );
};

// ── Periods Page ──────────────────────────────────────────────────────────────

export const PeriodsPage: React.FC = () => {
  const addNotification = useNotificationStore(s => s.add);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: periods, isLoading, isError } = useActivePeriods();
  const updateMutation = useUpdatePeriod();

  useEffect(() => {
    if (isError) addNotification('Failed to load active periods');
  }, [isError, addNotification]);

  // Local copy of all periods for carry-over management
  const [localPeriods, setLocalPeriods] = useState<Period[]>([]);
  useEffect(() => {
    if (periods) setLocalPeriods(periods);
  }, [periods]);

  const handleExpenseSave = (
    periodId: string,
    expenseId: string,
    newStatus: PeriodExpenseEntry['status'],
    overrideAmount: number | undefined,
    prevStatus: PeriodExpenseEntry['status']
  ) => {
    const sortedLocal = [...localPeriods].sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const periodIndex = sortedLocal.findIndex(p => p.id === periodId);
    const nextPeriod = periodIndex >= 0 && periodIndex < sortedLocal.length - 1
      ? sortedLocal[periodIndex + 1]
      : null;

    // Update current period
    const updatedCurrent = {
      ...sortedLocal[periodIndex],
      expenses: (sortedLocal[periodIndex].expenses || []).map(e =>
        e.expenseId === expenseId ? { ...e, status: newStatus, overrideAmount } : e
      ),
    };

    // Update next period carry-overs
    let updatedNext: Period | null = null;
    if (nextPeriod) {
      const sourceExpense = (sortedLocal[periodIndex].expenses || []).find(e => e.expenseId === expenseId);
      const existingCarryOver = (nextPeriod.expenses || []).find(
        e => e.expenseId === expenseId && e.isCarryOver
      );

      if (newStatus === 'Deferred' && !existingCarryOver && sourceExpense) {
        // Add carry-over to next period
        const carryOver: PeriodExpenseEntry = {
          ...sourceExpense,
          status: 'Unpaid',
          overrideAmount: undefined,
          isCarryOver: true,
        };
        updatedNext = {
          ...nextPeriod,
          expenses: [...(nextPeriod.expenses || []), carryOver],
        };
      } else if (newStatus !== 'Deferred' && existingCarryOver) {
        // Remove carry-over from next period
        updatedNext = {
          ...nextPeriod,
          expenses: (nextPeriod.expenses || []).filter(
            e => !(e.expenseId === expenseId && e.isCarryOver)
          ),
        };
      }
    }

    // Update local state
    const newLocalPeriods = sortedLocal.map(p => {
      if (p.id === periodId) return updatedCurrent;
      if (updatedNext && p.id === updatedNext.id) return updatedNext;
      return p;
    });
    setLocalPeriods(newLocalPeriods);

    // Save current period
    updateMutation.mutate(updatedCurrent, {
      onError: () => addNotification('Failed to update period'),
    });

    // Save next period if changed
    if (updatedNext) {
      updateMutation.mutate(updatedNext, {
        onError: () => addNotification('Failed to update next period carry-over'),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Flow</h1>
        <LoadingSpinner />
      </div>
    );
  }

  if (!localPeriods || localPeriods.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Flow</h1>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-white rounded" style={{ backgroundColor: '#2F6FB5' }}>
            Create Periods
          </button>
        </div>
        <p className="text-gray-500">No active periods available</p>
        <CreatePeriodsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  const sortedPeriods = [...localPeriods].sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Flow</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-white rounded" style={{ backgroundColor: '#2F6FB5' }}>
          Create Periods
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4">
          {sortedPeriods.map(period => (
            <PeriodColumn
              key={period.id}
              period={period}
              onExpenseSave={handleExpenseSave}
              isPending={updateMutation.isPending}
            />
          ))}
        </div>
      </div>

      <CreatePeriodsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
