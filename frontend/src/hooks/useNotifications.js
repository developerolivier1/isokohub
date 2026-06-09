import { useQuery, useMutation, useQueryClient } from 'react-query';
import { notificationAPI } from '../services/api';

export function useNotifications(params) {
  return useQuery(
    ['notifications', params],
    () => notificationAPI.getAll(params).then(res => res.data.data),
    { refetchInterval: 30000 }
  );
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation(
    (id) => notificationAPI.markRead(id),
    { onSuccess: () => queryClient.invalidateQueries('notifications') }
  );
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation(
    () => notificationAPI.markAllRead(),
    { onSuccess: () => queryClient.invalidateQueries('notifications') }
  );
}
