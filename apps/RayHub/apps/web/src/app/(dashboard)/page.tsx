import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LayoutDashboard } from 'lucide-react';
import { ShopeeConnectCard } from './_components/shopee-connect-card';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/dashboard/stats`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return null;
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Visão geral da sua operação no RayHub.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">sincronizados da Shopee</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos em Aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeOrders ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">pendentes, aprovados ou enviados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.monthlyRevenue ?? 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Últimos 15 dias: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.recentRevenue ?? 0)} ({stats?.recentOrderCount ?? 0} pedidos)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notas Emitidas no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.invoicesIssuedMonth ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">últimos 15 dias: {stats?.invoicesIssuedToday ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <ShopeeConnectCard />

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao RayHub</CardTitle>
          <CardDescription>
            A infraestrutura base está configurada! Navegue pelo menu lateral para acessar os módulos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
            <div className="flex flex-col items-center text-gray-500">
              <LayoutDashboard className="mb-2 h-8 w-8" />
              <span>Dashboard em construção</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

