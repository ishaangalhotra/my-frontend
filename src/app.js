import AdminPage from './pages/AdminPage';
import AdminRoute from './components/Routes/AdminRoute';

function App() {
  return (
    <Routes>
      {/* ...other routes */}
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
    </Routes>
  );
}