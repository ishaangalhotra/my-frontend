import { useState, useEffect } from 'react';
import { DataTable, ProductStatusBadge } from '../../components/admin';
import api from '../../utils/api';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/products?page=${page}&limit=${pagination.limit}`);
      setProducts(data.data);
      setPagination(prev => ({
        ...prev,
        page,
        total: data.total
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await api.put(`/admin/products/${productId}/status`, { status: newStatus });
      fetchProducts(pagination.page);
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const columns = [
    { Header: 'ID', accessor: '_id' },
    { Header: 'Name', accessor: 'name' },
    { Header: 'Price', accessor: 'price' },
    { 
      Header: 'Status', 
      accessor: 'status',
      Cell: ({ value, row }) => (
        <ProductStatusBadge 
          status={value} 
          onChange={(newStatus) => handleStatusChange(row.original._id, newStatus)}
        />
      )
    },
    // Add more columns as needed
  ];

  return (
    <div className="products-page">
      <h1>Product Management</h1>
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchProducts}
      />
    </div>
  );
};