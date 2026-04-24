import React, { useState, useEffect } from 'react';
import { useAllIncomes, useCreateIncome, useUpdateIncome, useDeleteIncome } from '../api/incomes';
import { useNotificationStore } from '../store/notificationStore';
import { formatCurrency } from '../utils/dateUtils';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Income } from '../types';

const emptyForm = (): Omit<Income, 'id' | 'name'> => ({
  source: '',
  amount: 0,
  dayOfMonth: 1,
  isPaycheck: false,
  inactive: false,
  inactiveDate: '',
  scheduledDate: '',
});

export const IncomePage: React.FC = () => {
  const addNotification = useNotificationStore(s => s.add);
  const [showInactive, setShowInactive] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const { data: incomes, isLoading, isError } = useAllIncomes();
  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();
  const deleteMutation = useDeleteIncome();

  useEffect(() => {
    if (isError) addNotification('Failed to load incomes');
  }, [isError, addNotification]);

  const displayed = (incomes ?? [])
    .filter(i => showInactive || !i.inactive)
    .sort((a, b) => a.source.localeCompare(b.source, undefined, { sensitivity: 'base' }));

  const handleEdit = (income: Income) => {
    setEditingId(income.id);
    setIsAdding(false);
    setForm({
      source: income.source,
      amount: income.amount,
      dayOfMonth: income.dayOfMonth,
      isPaycheck: income.isPaycheck,
      inactive: income.inactive,
      inactiveDate: income.inactiveDate ?? '',
      scheduledDate: income.scheduledDate,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setForm(emptyForm());
  };

  const handleSave = (id?: string) => {
    const payload = {
      ...form,
      inactiveDate: form.inactiveDate || undefined,
    };

    if (id) {
      updateMutation.mutate(
        { ...payload, id, name: form.source },
        {
          onSuccess: () => { setEditingId(null); setForm(emptyForm()); },
          onError: () => addNotification('Failed to update income'),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { setIsAdding(false); setForm(emptyForm()); },
        onError: () => addNotification('Failed to create income'),
      });
    }
  };

  const handleDelete = (income: Income) => {
    if (confirm(`Delete income "${income.source}"?`)) {
      deleteMutation.mutate(income.id, {
        onError: () => addNotification('Failed to delete income'),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-left">Income</h1>
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
            + Add Income
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
                <th className="text-left p-3">Source</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-center p-3">Day</th>
                <th className="text-center p-3">Paycheck</th>
                <th className="text-center p-3">Inactive</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <IncomeFormRow
                  form={form}
                  setForm={setForm}
                  onSave={() => handleSave()}
                  onCancel={handleCancel}
                  isPending={isPending}
                />
              )}

              {displayed.length === 0 && !isAdding ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No incomes found
                  </td>
                </tr>
              ) : (
                displayed.map(income =>
                  editingId === income.id ? (
                    <IncomeFormRow
                      key={income.id}
                      form={form}
                      setForm={setForm}
                      onSave={() => handleSave(income.id)}
                      onCancel={handleCancel}
                      isPending={isPending}
                    />
                  ) : (
                    <IncomeRow
                      key={income.id}
                      income={income}
                      onEdit={() => handleEdit(income)}
                      onDelete={() => handleDelete(income)}
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

interface IncomeRowProps {
  income: Income;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const IncomeRow: React.FC<IncomeRowProps> = ({ income, onEdit, onDelete, isDeleting }) => (
  <tr className={`border-b hover:bg-gray-50 ${income.inactive ? 'opacity-50' : ''}`}>
    <td className="p-3 text-left font-medium">{income.source}</td>
    <td className="p-3 text-right">{formatCurrency(income.amount)}</td>
    <td className="p-3 text-center">{income.dayOfMonth}</td>
    <td className="p-3 text-center">{income.isPaycheck ? '✓' : '—'}</td>
    <td className="p-3 text-center">{income.inactive ? '✓' : '—'}</td>
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

// ── Editable form row ─────────────────────────────────────────────────────────

interface IncomeFormRowProps {
  form: ReturnType<typeof emptyForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

const IncomeFormRow: React.FC<IncomeFormRowProps> = ({ form, setForm, onSave, onCancel, isPending }) => {
  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <tr className="border-b bg-blue-50">
      <td className="p-2">
        <input
          type="text"
          value={form.source}
          onChange={e => set('source', e.target.value)}
          placeholder="Source"
          className="border rounded px-2 py-1 w-full text-sm"
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          value={form.amount}
          onChange={e => set('amount', parseFloat(e.target.value) || 0)}
          className="border rounded px-2 py-1 w-28 text-sm text-right"
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
        <input type="checkbox" checked={form.isPaycheck} onChange={e => set('isPaycheck', e.target.checked)} className="w-4 h-4" />
      </td>
      <td className="p-2 text-center">
        <input type="checkbox" checked={form.inactive} onChange={e => set('inactive', e.target.checked)} className="w-4 h-4" />
      </td>
      <td className="p-2">
        <div className="flex gap-2 justify-end">
          <button
            onClick={onSave}
            disabled={isPending || !form.source}
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
