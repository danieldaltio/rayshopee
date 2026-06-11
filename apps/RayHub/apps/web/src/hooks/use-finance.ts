import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

export function useFinanceSummary(year: number, month: number) {
  return useQuery({
    queryKey: ['finance', 'summary', year, month],
    queryFn: async () => {
      const { data } = await api.get('/finance/summary', {
        params: { year, month }
      });
      return data;
    },
  });
}

export function useFinanceAccounts() {
  return useQuery({
    queryKey: ['finance', 'accounts'],
    queryFn: async () => {
      const { data } = await api.get('/finance/accounts');
      return data;
    },
  });
}

export function useFinanceWithdraw() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (amount: number) => {
      const { data } = await api.post('/finance/withdraw', { amount });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}
