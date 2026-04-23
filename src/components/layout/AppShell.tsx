import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { NotificationBanner } from '../common/NotificationBanner';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <NotificationBanner />
      <main className="w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
