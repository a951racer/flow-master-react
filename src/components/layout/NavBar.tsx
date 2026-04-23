import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const clearToken = useAuthStore(s => s.clearToken);

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <nav className="text-white px-6 py-1" style={{ backgroundColor: '#0F2E5D' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <img 
            src="/logo.png" 
            alt="Flow Master Logo" 
            className="h-[86px] w-[86px] object-contain"
          />
          
          {/* Navigation Links */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-400 font-semibold'
                : 'text-gray-300 hover:text-white'
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/periods"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-400 font-semibold'
                : 'text-gray-300 hover:text-white'
            }
          >
            Flow
          </NavLink>
          <NavLink
            to="/expenses"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-400 font-semibold'
                : 'text-gray-300 hover:text-white'
            }
          >
            Expenses
          </NavLink>
          <NavLink
            to="/income"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-400 font-semibold'
                : 'text-gray-300 hover:text-white'
            }
          >
            Income
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-400 font-semibold'
                : 'text-gray-300 hover:text-white'
            }
          >
            Admin
          </NavLink>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded text-white font-medium"
          style={{ backgroundColor: '#5FA343' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4e8a38')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#5FA343')}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
