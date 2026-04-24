import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { NotificationBanner } from '../common/NotificationBanner';

export const AppShell: React.FC = () => {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: 'url(/app-bg.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundAttachment: 'fixed',
      }}
    >
      <NavBar />
      <NotificationBanner />
      <main className="w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
