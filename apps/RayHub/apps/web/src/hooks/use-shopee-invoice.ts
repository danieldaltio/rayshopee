import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Uploads a single NF-e to Shopee for a given order.
 */
export function useUploadInvoiceToShopee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.post(`/shopee/upload-invoice/${orderId}`);
      return response.data as {
        success: boolean;
        orderId: string;
        orderSn: string;
        chaveAcesso?: string;
        error?: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

/**
 * Syncs all pending invoices — sends authorized NF-e that haven't been uploaded to Shopee yet.
 */
export function useSyncPendingInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/shopee/sync-invoices');
      return response.data as {
        total: number;
        success: number;
        failed: number;
        results: Array<{
          orderId: string;
          orderSn: string | null;
          success: boolean;
          error?: string;
        }>;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Syncs orders from Shopee (pulls new orders).
 */
export function useSyncShopeeOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/shopee/sync-orders');
      return response.data as { success: boolean; count: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}
