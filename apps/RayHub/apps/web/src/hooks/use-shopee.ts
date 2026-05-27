import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

export function useShopeeStatus() {
  return useQuery({
    queryKey: ['shopee-status'],
    queryFn: async () => {
      const res = await api.get('/shopee/status');
      return res.data as { connected: boolean; shopId?: string; expiresAt?: string };
    },
  });
}

export function useShopeeAuthUrl() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.get('/shopee/auth-url');
      return res.data as { url: string };
    },
  });
}
