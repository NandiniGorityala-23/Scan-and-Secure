import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';

export const useProducts = (params) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () =>
      api
        .get('/products', { params })
        .then((r) => r.data),
    keepPreviousData: true,
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/products', data).then((r) => r.data.product),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create'),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/products/${id}`, data).then((r) => r.data.product),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });
};

export const useImportProducts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      api
        .post('/products/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${data.imported} products imported`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Import failed'),
  });
};
