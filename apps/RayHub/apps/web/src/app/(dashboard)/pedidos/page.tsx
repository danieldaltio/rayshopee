'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';
import { useOrders } from '@/hooks/use-orders';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ORDER_STATUSES = [
  'Todos',
  'Para Reservar',
  'Para Emitir',
  'Para Enviar',
  'Para Imprimir',
  'Para Retirada',
  'Enviado',
  'Anulado',
];

export default function PedidosPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Todos');
  const take = 10;

  const { orders, meta, isLoading } = useOrders(take, page * take, status, search);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500">
            Acompanhe o funil de vendas e o status de envio.
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar por Nº Pedido ou Cliente..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={status}
              onValueChange={(val) => {
                if (val) setStatus(val);
                setPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Pedido (Shopee)</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Carregando pedidos...
                  </TableCell>
                </TableRow>
              ) : orders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                orders?.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-blue-600">
                      {order.shopee_order_sn || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(order.data_pedido).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>{order.customer?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'Anulado' ? 'destructive' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/pedidos/${order.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="p-4 border-t flex justify-end">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-500 px-2">
              Página {page + 1} de {meta?.total ? Math.ceil(meta.total / take) : 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!orders || orders.length < take}
            >
              Próxima
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
