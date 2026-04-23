import React, { useState, useEffect } from 'react';
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
  usePaymentSources,
  useCreatePaymentSource,
  useUpdatePaymentSource,
  useDeletePaymentSource,
  useUsers,
} from '../api/admin';
import { useNotificationStore } from '../store/notificationStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { ExpenseCategory, PaymentSource, User } from '../types';

export const AdminPage: React.FC = () => {
  const addNotification = useNotificationStore(s => s.add);

  const categoriesQuery = useExpenseCategories();
  const sourcesQuery = usePaymentSources();
  const usersQuery = useUsers();

  // Push notifications for fetch errors
  useEffect(() => {
    if (categoriesQuery.isError) {
      addNotification('Failed to load expense categories');
    }
  }, [categoriesQuery.isError, addNotification]);

  useEffect(() => {
    if (sourcesQuery.isError) {
      addNotification('Failed to load payment sources');
    }
  }, [sourcesQuery.isError, addNotification]);

  useEffect(() => {
    if (usersQuery.isError) {
      addNotification('Failed to load users');
    }
  }, [usersQuery.isError, addNotification]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {/* Expense Categories Section */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Expense Categories</h2>
        {categoriesQuery.isLoading ? (
          <LoadingSpinner />
        ) : categoriesQuery.data && categoriesQuery.data.length > 0 ? (
          <ExpenseCategoryTable categories={categoriesQuery.data} />
        ) : (
          <p className="text-gray-500">No expense categories available</p>
        )}
      </section>

      {/* Payment Sources Section */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Payment Sources</h2>
        {sourcesQuery.isLoading ? (
          <LoadingSpinner />
        ) : sourcesQuery.data && sourcesQuery.data.length > 0 ? (
          <PaymentSourceTable sources={sourcesQuery.data} />
        ) : (
          <p className="text-gray-500">No payment sources available</p>
        )}
      </section>

      {/* Users Section */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        {usersQuery.isLoading ? (
          <LoadingSpinner />
        ) : usersQuery.data && usersQuery.data.length > 0 ? (
          <UserTable users={usersQuery.data} />
        ) : (
          <p className="text-gray-500">No users found</p>
        )}
      </section>
    </div>
  );
};

// ── Expense Category Table ───────────────────────────────────────────────────

interface ExpenseCategoryTableProps {
  categories: ExpenseCategory[];
}

const ExpenseCategoryTable: React.FC<ExpenseCategoryTableProps> = ({ categories }) => {
  const [newName, setNewName] = useState('');
  const createMutation = useCreateExpenseCategory();
  const addNotification = useNotificationStore(s => s.add);

  const handleCreate = () => {
    if (!newName.trim()) return;
    
    createMutation.mutate(newName, {
      onSuccess: () => {
        setNewName('');
      },
      onError: () => {
        addNotification('Failed to create expense category');
      },
    });
  };

  // Sort categories alphabetically by name
  const sortedCategories = [...categories].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  return (
    <div>
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Name</th>
            <th className="text-right p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedCategories.map(category => (
            <ExpenseCategoryRow key={category.id} category={category} />
          ))}
        </tbody>
      </table>
      
      {/* Create New Row */}
      <div className="flex gap-2 p-2 bg-gray-50 rounded">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New category name..."
          className="flex-1 border rounded px-2 py-1"
          disabled={createMutation.isPending}
        />
        <button
          onClick={handleCreate}
          disabled={createMutation.isPending || !newName.trim()}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
};

interface ExpenseCategoryRowProps {
  category: ExpenseCategory;
}

const ExpenseCategoryRow: React.FC<ExpenseCategoryRowProps> = ({ category }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const updateMutation = useUpdateExpenseCategory();
  const deleteMutation = useDeleteExpenseCategory();
  const addNotification = useNotificationStore(s => s.add);

  const handleSave = () => {
    updateMutation.mutate(
      { ...category, name: editedName },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
        onError: () => {
          addNotification('Failed to update expense category');
          setEditedName(category.name); // Rollback local state
        },
      }
    );
  };

  const handleCancel = () => {
    setEditedName(category.name);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete category "${category.name}"?`)) {
      deleteMutation.mutate(category.id, {
        onError: () => {
          addNotification('Failed to delete expense category');
        },
      });
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-2 text-left">
        {isEditing ? (
          <input
            type="text"
            value={editedName}
            onChange={e => setEditedName(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        ) : (
          <span>{category.name}</span>
        )}
      </td>
      <td className="p-2">
        {isEditing ? (
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

// ── Payment Source Table ─────────────────────────────────────────────────────

interface PaymentSourceTableProps {
  sources: PaymentSource[];
}

const PaymentSourceTable: React.FC<PaymentSourceTableProps> = ({ sources }) => {
  const [newName, setNewName] = useState('');
  const createMutation = useCreatePaymentSource();
  const addNotification = useNotificationStore(s => s.add);

  const handleCreate = () => {
    if (!newName.trim()) return;
    
    createMutation.mutate(newName, {
      onSuccess: () => {
        setNewName('');
      },
      onError: () => {
        addNotification('Failed to create payment source');
      },
    });
  };

  // Sort sources alphabetically by name
  const sortedSources = [...sources].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  return (
    <div>
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Name</th>
            <th className="text-right p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedSources.map(source => (
            <PaymentSourceRow key={source.id} source={source} />
          ))}
        </tbody>
      </table>
      
      {/* Create New Row */}
      <div className="flex gap-2 p-2 bg-gray-50 rounded">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New payment source name..."
          className="flex-1 border rounded px-2 py-1"
          disabled={createMutation.isPending}
        />
        <button
          onClick={handleCreate}
          disabled={createMutation.isPending || !newName.trim()}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
};

interface PaymentSourceRowProps {
  source: PaymentSource;
}

const PaymentSourceRow: React.FC<PaymentSourceRowProps> = ({ source }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(source.name);
  const updateMutation = useUpdatePaymentSource();
  const deleteMutation = useDeletePaymentSource();
  const addNotification = useNotificationStore(s => s.add);

  const handleSave = () => {
    updateMutation.mutate(
      { ...source, name: editedName },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
        onError: () => {
          addNotification('Failed to update payment source');
          setEditedName(source.name); // Rollback local state
        },
      }
    );
  };

  const handleCancel = () => {
    setEditedName(source.name);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete payment source "${source.name}"?`)) {
      deleteMutation.mutate(source.id, {
        onError: () => {
          addNotification('Failed to delete payment source');
        },
      });
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-2 text-left">
        {isEditing ? (
          <input
            type="text"
            value={editedName}
            onChange={e => setEditedName(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        ) : (
          <span>{source.name}</span>
        )}
      </td>
      <td className="p-2">
        {isEditing ? (
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

// ── User Table ───────────────────────────────────────────────────────────────

interface UserTableProps {
  users: User[];
}

const UserTable: React.FC<UserTableProps> = ({ users }) => {
  // Sort users alphabetically by last name, then first name
  const sortedUsers = [...users].sort((a, b) =>
    a.lastName.localeCompare(b.lastName, undefined, { sensitivity: 'base' }) ||
    a.firstName.localeCompare(b.firstName, undefined, { sensitivity: 'base' })
  );

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">First Name</th>
          <th className="text-left p-2">Last Name</th>
          <th className="text-left p-2">Email</th>
        </tr>
      </thead>
      <tbody>
        {sortedUsers.map(user => (
          <tr key={user.id} className="border-b hover:bg-gray-50">
            <td className="p-2 text-left">{user.firstName}</td>
            <td className="p-2 text-left">{user.lastName}</td>
            <td className="p-2 text-left text-gray-600">{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
