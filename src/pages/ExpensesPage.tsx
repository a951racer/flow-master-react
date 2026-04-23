import React, { useState, useEffect } from 'react';
import { useAllExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '../api/expenses';
import { useExpenseCategories, usePaymentSources } from '../api/admin';
import { useNotificationStore } from '../store/notificationStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Expense } from '../types';

const EXPENSE_TYPES = ['expense', 'debt', 'bill'] as const;

const emptyForm = (): Omit<Expense, 'id' | 'name'> => ({
  payee: '',
  amount: 0,
  dayOfMonth: 1,
  type: 'expense',
  payeeUrl: '',
  required: false,
  inactive: false,
  inactiveDate: '',
  categoryId: '',
  paymentSourceId: '',
  dueDate: '',
});

export const ExpensesPage: React.FC = () => {
  const addNotification = useNotificationStore(s => s.add);
  const [showInactive, setShowInactive] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const { data: expenses, isLoading, isError } = useAllExpenses();
  const { data: categories = [] } = useExpenseCategories();
  const { data: paymentSources = [] } = usePaymentSources();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  useEffect(() => {
    if (isError) addNotification('Failed to load expenses');
  }, [isError, addNotification]);

  const displayed = (expenses ?? [])
    .filter(e => showInactive || !e.inactive)
    .sort((a, b) => a.payee.localeCompare(b.payee, undefined, { sensitivity: 'base' }));

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setIsAdding(false);
    setForm({
      payee: expense.payee,
      amount: expense.amount,
      dayOfMonth: expense.dayOfMonth,
      type: expense.type,
      payeeUrl: expense.payeeUrl ?? '',
      required: expense.required,
      inactive: expense.inactive,
      inactiveDate: expense.inactiveDate ?? '',
      categoryId: expense.categoryId,
      paymentSourceId: expense.paymentSourceId,
      dueDate: expense.dueDate,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setForm(emptyForm());
  };

  const handleSave = (id?: string) => {
    const payload = {
      ...form,
      payeeUrl: form.payeeUrl || undefined,
      inactiveDate: form.inactiveDate || undefined,
    };

    if (id) {
      updateMutation.mutate(
        { ...payload, id, name: form.payee },
        {
          onSuccess: () => { setEditingId(null); setForm(emptyForm()); },
          onError: () => addNotification('Failed to update expense'),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { setIsAdding(false); setForm(emptyForm()); },
        onError: () => addNotification('Failed to create expense'),
      });
    }
  };

  const handleDelete = (expense: Expense) => {
    if (confirm(`Delete expense "${expense.payee}"?`)) {
      deleteMutation.mutate(expense.id, {
        onError: () => addNotification('Failed to delete expense'),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-left">Expenses</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="w-4 h-4"
            />
            Show inactive
          </label>
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setForm(emptyForm()); }}
            className="px-4 py-2 text-white rounded"
            style={{ backgroundColor: '#5FA343' }}
          >
            + Add Expense
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Payee</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Payment Source</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-center p-3">Day</th>
                <th className="text-center p-3">Required</th>
                <th className="text-center p-3">Inactive</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Add row */}
              {isAdding && (
                <ExpenseFormRow
                  form={form}
                  setForm={setForm}
                  categories={categories}
                  paymentSources={paymentSources}
                  onSave={() => handleSave()}
                  onCancel={handleCancelEdit}
                  isPending={isPending}
                />
              )}

              {displayed.length === 0 && !isAdding ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                displayed.map(expense =>
                  editingId === expense.id ? (
                    <ExpenseFormRow
                      key={expense.id}
                      form={form}
                      setForm={setForm}
                      categories={categories}
                      paymentSources={paymentSources}
                      onSave={() => handleSave(expense.id)}
                      onCancel={handleCancelEdit}
                      isPending={isPending}
                    />
                  ) : (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      categories={categories}
                      paymentSources={paymentSources}
                      onEdit={() => handleEdit(expense)}
                      onDelete={() => handleDelete(expense)}
                      isDeleting={deleteMutation.isPending}
                    />
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Read-only row ─────────────────────────────────────────────────────────────

interface ExpenseRowProps {
  expense: Expense;
  categories: { id: string | number; name: string }[];
  paymentSources: { id: string | number; name: string }[];
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const ExpenseRow: React.FC<ExpenseRowProps> = ({ expense, categories, paymentSources, onEdit, onDelete, isDeleting }) => {
  const categoryName = categories.find(c => c.id === expense.categoryId)?.name ?? '—';
  const sourceName = paymentSources.find(s => s.id === expense.paymentSourceId)?.name ?? '—';

  return (
    <tr className={`border-b hover:bg-gray-50 ${expense.inactive ? 'opacity-50' : ''}`}>
      <td className="p-3 text-left font-medium">{expense.payee}</td>
      <td className="p-3 text-left capitalize">{expense.type}</td>
      <td className="p-3 text-left">{categoryName}</td>
      <td className="p-3 text-left">{sourceName}</td>
      <td className="p-3 text-right">${expense.amount.toFixed(2)}</td>
      <td className="p-3 text-center">{expense.dayOfMonth}</td>
      <td className="p-3 text-center">{expense.required ? '✓' : '—'}</td>
      <td className="p-3 text-center">{expense.inactive ? '✓' : '—'}</td>
      <td className="p-3">
        <div className="flex gap-2 justify-end">
          <button
            onClick={onEdit}
            className="px-3 py-1 text-white rounded text-sm"
            style={{ backgroundColor: '#2F6FB5' }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

// ── Editable form row ─────────────────────────────────────────────────────────

interface ExpenseFormRowProps {
  form: ReturnType<typeof emptyForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  categories: { id: string | number; name: string }[];
  paymentSources: { id: string | number; name: string }[];
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

const ExpenseFormRow: React.FC<ExpenseFormRowProps> = ({ form, setForm, categories, paymentSources, onSave, onCancel, isPending }) => {
  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <tr className="border-b bg-blue-50">
      <td className="p-2">
        <input
          type="text"
          value={form.payee}
          onChange={e => set('payee', e.target.value)}
          placeholder="Payee"
          className="border rounded px-2 py-1 w-full text-sm"
        />
      </td>
      <td className="p-2">
        <select value={form.type} onChange={e => set('type', e.target.value)} className="border rounded px-2 py-1 w-full text-sm">
          {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td className="p-2">
        <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className="border rounded px-2 py-1 w-full text-sm">
          <option value="">— select —</option>
          {categories.map(c => <option key={String(c.id)} value={String(c.id)}>{c.name}</option>)}
        </select>
      </td>
      <td className="p-2">
        <select value={form.paymentSourceId} onChange={e => set('paymentSourceId', e.target.value)} className="border rounded px-2 py-1 w-full text-sm">
          <option value="">— select —</option>
          {paymentSources.map(s => <option key={String(s.id)} value={String(s.id)}>{s.name}</option>)}
        </select>
      </td>
      <td className="p-2">
        <input
          type="number"
          value={form.amount}
          onChange={e => set('amount', parseFloat(e.target.value) || 0)}
          className="border rounded px-2 py-1 w-24 text-sm text-right"
          min={0}
          step={0.01}
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          value={form.dayOfMonth}
          onChange={e => set('dayOfMonth', parseInt(e.target.value) || 1)}
          className="border rounded px-2 py-1 w-16 text-sm text-center"
          min={1}
          max={31}
        />
      </td>
      <td className="p-2 text-center">
        <input type="checkbox" checked={form.required} onChange={e => set('required', e.target.checked)} className="w-4 h-4" />
      </td>
      <td className="p-2 text-center">
        <input type="checkbox" checked={form.inactive} onChange={e => set('inactive', e.target.checked)} className="w-4 h-4" />
      </td>
      <td className="p-2">
        <div className="flex gap-2 justify-end">
          <button
            onClick={onSave}
            disabled={isPending || !form.payee || !form.categoryId || !form.paymentSourceId}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
};
