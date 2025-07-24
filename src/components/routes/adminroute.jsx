import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AdminRoute({ children }) {
  const { userInfo } = useSelector(state => state.auth);
  return userInfo?.role === 'admin' ? children : <Navigate to="/login" />;
}