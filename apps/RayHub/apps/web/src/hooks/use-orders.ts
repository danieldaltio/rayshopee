import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useOrders(take = 10, skip = 0, status = 'Todos', search = '') {
  const query = useQuery({
    queryKey: ['orders', take, skip, status, search],
    queryFn: async () => {
      const response = await api.get('/orders', {
        params: { take, skip, status, search },
      });
      return response.data;
    },
  });

  return {
    orders: query.data?.data,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useOrder(id: string) {
  const query = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
