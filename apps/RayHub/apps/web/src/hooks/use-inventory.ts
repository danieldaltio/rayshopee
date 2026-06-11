import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/summary');
      return data;
    },
  });
}

export function useInventoryLocations() {
  return useQuery({
    queryKey: ['inventory', 'locations'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/locations');
      return data;
    },
  });
}

export function useInventoryMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: {
      type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
      quantity: number;
      productId: string;
      sourceLocId?: string;
      destLocId?: string;
      reason?: string;
    }) => {
      const { data } = await api.post('/inventory/movement', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Para atualizar a tabela de produtos também
    },
  });
}
