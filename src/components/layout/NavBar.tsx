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
    <nav className="bg-gray-800 text-white px-6 py-1">
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
            Periods
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
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
