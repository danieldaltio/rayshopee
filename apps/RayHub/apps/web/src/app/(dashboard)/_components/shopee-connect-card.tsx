'use client';

import { useShopeeStatus, useShopeeAuthUrl } from '@/hooks/use-shopee';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function ShopeeConnectCard() {
  const { data: shopeeStatus, isLoading: isLoadingShopee } = useShopeeStatus();
  const shopeeAuthUrl = useShopeeAuthUrl();

  async function handleConnectShopee() {
    const result = await shopeeAuthUrl.mutateAsync();
    window.location.href = result.url;
  }

  if (isLoadingShopee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integração Shopee</CardTitle>
        </CardHeader>
        <CardContent>Carregando status...</CardContent>
      </Card>
    );
  }

  if (shopeeStatus?.connected) {
    return (
      <Card className="border-green-200 bg-green-50/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">Integração Shopee</CardTitle>
                <CardDescription>
                  Loja #{shopeeStatus.shopId} conectada
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-600">Conectado</Badge>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg">Integração Shopee</CardTitle>
              <CardDescription>
                Conecte sua loja Shopee para começar a gerenciar seus pedidos
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary">Desconectado</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Para que o RayHub possa sincronizar seus pedidos e gerenciar seus produtos, 
            você precisa autorizar o acesso à sua conta de vendedor da Shopee.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={handleConnectShopee}
              disabled={shopeeAuthUrl.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {shopeeAuthUrl.isPending ? 'Redirecionando...' : 'Conectar com a Shopee'}
            </Button>
            <Link 
              href="/configuracoes" 
              className={buttonVariants({ variant: 'outline' })}
            >
              Ver detalhes nas Configurações
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
