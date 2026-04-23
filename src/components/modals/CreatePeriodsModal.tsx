import React, { useState, useEffect } from 'react';
import { useGeneratePeriods } from '../../api/periods';
import { useNotificationStore } from '../../store/notificationStore';

interface CreatePeriodsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePeriodsModal: React.FC<CreatePeriodsModalProps> = ({ isOpen, onClose }) => {
  const [count, setCount] = useState<string>('1');
  const [error, setError] = useState<string>('');
  const generatePeriods = useGeneratePeriods();
  const addNotification = useNotificationStore(s => s.add);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCount('1');
      setError('');
    }
  }, [isOpen]);

  const isValidCount = (): boolean => {
    const num = parseInt(count, 10);
    return Number.isInteger(num) && num >= 1 && num <= 12;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidCount()) return;

    const numCount = parseInt(count, 10);
    try {
      await generatePeriods.mutateAsync(numCount);
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to generate periods';
      setError(message);
      addNotification(message);
    }
  };

  const handleClose = () => {
    if (!generatePeriods.isPending) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Periods</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
              Number of periods (1-12)
            </label>
            <input
              id="count"
              type="number"
              min="1"
              max="12"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={generatePeriods.isPending}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={generatePeriods.isPending}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValidCount() || generatePeriods.isPending}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatePeriods.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
