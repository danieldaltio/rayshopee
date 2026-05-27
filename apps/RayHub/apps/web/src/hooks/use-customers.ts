import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface CustomerData {
  id?: string;
  name: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  shopee_buyer_username?: string;
}

export function useCustomers(take = 10, skip = 0, search = '') {
  const query = useQuery({
    queryKey: ['customers', take, skip, search],
    queryFn: async () => {
      const response = await api.get('/customers', {
        params: { take, skip, search },
      });
      return response.data;
    },
  });

  return {
    customers: query.data?.data,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useCustomer(id?: string) {
  const queryClient = useQueryClient();
  const isNew = id === 'novo';

  const query = useQuery({
    queryKey: ['customer', id],
    queryFn: async (): Promise<CustomerData | null> => {
      if (isNew) return null;
      const response = await api.get(`/customers/${id}`);
      return response.data;
    },
    enabled: !!id && !isNew,
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerData) => {
      if (isNew) {
        const response = await api.post('/customers', data);
        return response.data;
      }
      const response = await api.put(`/customers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
    },
  });

  return {
    customer: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    saveCustomer: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
