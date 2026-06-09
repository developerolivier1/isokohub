import { useQuery, useMutation, useQueryClient } from 'react-query';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

export function useOrders(params) {
  return useQuery(
    ['orders', params],
    () => orderAPI.getAll(params).then(res => res.data.data),
    { keepPreviousData: true }
  );
}

export function useOrder(id) {
  return useQuery(
    ['order', id],
    () => orderAPI.getById(id).then(res => res.data.data),
    { enabled: !!id }
  );
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation(
    (data) => orderAPI.create(data).then(res => res.data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Order placed successfully');
      },
      onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to place order'),
    }
  );
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, status, note }) => orderAPI.updateStatus(id, status, note).then(res => res.data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Order status updated');
      },
      onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update status'),
    }
  );
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, reason }) => orderAPI.cancel(id, reason).then(res => res.data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Order cancelled');
      },
      onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to cancel order'),
    }
  );
}
