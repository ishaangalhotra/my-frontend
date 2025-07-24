import { useEffect, useState } from 'react';
import { StatsCard, RecentOrdersTable } from '../../components/admin';
import api from '../../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <StatsCard title="Total Users" value={stats.usersCount} icon="users" />
        <StatsCard title="Total Products" value={stats.productsCount} icon="box" />
        <StatsCard title="Total Orders" value={stats.ordersCount} icon="shopping-cart" />
      </div>
      
      <div className="recent-orders">
        <h2>Recent Orders</h2>
        <RecentOrdersTable orders={recentOrders} />
      </div>
    </div>
  );
};