import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useInvoices(take = 10, skip = 0, search = '') {
  const query = useQuery({
    queryKey: ['invoices', take, skip, search],
    queryFn: async () => {
      const response = await api.get('/invoices', {
        params: { take, skip, search },
      });
      return response.data;
    },
  });

  return {
    invoices: query.data?.data,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useEmitInvoice() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.post(`/invoices/emit/${orderId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });

  return mutation;
}
