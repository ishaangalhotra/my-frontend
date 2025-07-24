import AdminNav from '../components/Admin/Nav';
import AdminDashboard from '../components/Admin/Dashboard';

export default function AdminPage() {
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '240px' }}>
        <AdminNav />
      </div>
      <div style={{ flex: 1, padding: '20px' }}>
        <AdminDashboard />
      </div>
    </div>
  );
}