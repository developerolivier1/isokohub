import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';

export function useProducts(params) {
  return useQuery(
    ['products', params],
    () => productAPI.getAll(params).then(res => res.data.data),
    { keepPreviousData: true }
  );
}

export function useFeaturedProducts() {
  return useQuery('featured-products', () =>
    productAPI.getFeatured().then(res => res.data.data)
  );
}

export function useProduct(id) {
  return useQuery(
    ['product', id],
    () => productAPI.getById(id).then(res => res.data.data),
    { enabled: !!id }
  );
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation(
    (data) => productAPI.create(data).then(res => res.data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Product created successfully');
      },
      onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to create product'),
    }
  );
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }) => productAPI.update(id, data).then(res => res.data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Product updated successfully');
      },
      onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update product'),
    }
  );
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation(
    (id) => productAPI.delete(id).then(res => res.data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Product deleted');
      },
      onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to delete product'),
    }
  );
}
