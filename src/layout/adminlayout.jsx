import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components';

const AdminLayout = () => {
  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};