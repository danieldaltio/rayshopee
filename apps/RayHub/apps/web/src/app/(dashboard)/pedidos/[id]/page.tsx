'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Receipt, Box, User, AlertCircle, CheckCircle, Download, FileCode } from 'lucide-react';
import { useOrder } from '@/hooks/use-orders';
import { useEmitInvoice } from '@/hooks/use-invoices';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

export default function PedidoDetalhePage() {
  const params = useParams();
  const router = useRouter();

  const { order, isLoading } = useOrder(params.id as string);
  const emitInvoiceMutation = useEmitInvoice();

  if (isLoading) {
    return <div className="p-6">Carregando detalhes do pedido...</div>;
  }

  if (!order) {
    return <div className="p-6">Pedido não encontrado.</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value));
  };

  const handleEmitInvoice = () => {
    emitInvoiceMutation.mutate(order.id);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/pedidos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            Pedido {order.shopee_order_sn}
            <Badge variant={order.status === 'Anulado' ? 'destructive' : 'default'} className="text-sm">
              {order.status}
            </Badge>
          </h1>
          <p className="text-sm text-gray-500">
            Realizado em {new Date(order.data_pedido).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Coluna Principal (Itens e Cliente) */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Box className="h-5 w-5 text-gray-500" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.product?.name || 'Produto Excluído'}</div>
                        <div className="text-xs text-gray-500">SKU: {item.product?.sku || '-'}</div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantidade}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.preco_unitario)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-gray-500" />
                Dados do Comprador
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Cliente</p>
                <p className="font-medium">{order.customer?.name}</p>
                <p className="text-sm text-gray-600">{order.customer?.cpf_cnpj || 'Sem documento'}</p>
                <p className="text-sm text-gray-600">User: {order.customer?.shopee_buyer_username || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Endereço de Entrega</p>
                <p className="text-sm text-gray-800">
                  {order.customer?.endereco_rua}, {order.customer?.endereco_numero}
                  {order.customer?.endereco_complemento && ` - ${order.customer.endereco_complemento}`}
                </p>
                <p className="text-sm text-gray-800">
                  {order.customer?.endereco_bairro} - {order.customer?.endereco_cidade}/{order.customer?.endereco_uf}
                </p>
                <p className="text-sm text-gray-800">CEP: {order.customer?.endereco_cep}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral (Totais e Ações) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal dos itens</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frete</span>
                <span>{formatCurrency(order.frete)}</span>
              </div>
              {order.desconto > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto Shopee</span>
                  <span>- {formatCurrency(order.desconto)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Recebido</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-4">
                <div className="flex justify-between text-sm font-medium text-orange-800">
                  <span>Taxa Shopee (Estimada)</span>
                  <span>- {formatCurrency(order.shopee_comissao)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-green-700 mt-1">
                  <span>Receita Líquida</span>
                  <span>{formatCurrency(order.total - order.shopee_comissao)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={order.invoice ? "border-green-200 bg-green-50/50" : "border-blue-200 bg-blue-50/50"}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-lg ${order.invoice ? 'text-green-900' : 'text-blue-900'}`}>
                {order.invoice ? <CheckCircle className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                Faturamento (NF-e)
              </CardTitle>
              {!order.invoice && (
                <CardDescription className="text-blue-700/80">
                  Emita a nota fiscal para proceder com o envio.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {order.invoice ? (
                <div className="space-y-4">
                  <div className="text-sm bg-white p-3 rounded border border-green-100">
                    <p className="text-xs text-gray-500 mb-1">Chave de Acesso</p>
                    <p className="font-mono text-xs break-all">{order.invoice.chave_acesso}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full justify-start text-sm" onClick={() => alert('Download PDF')}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar DANFE (PDF)
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-sm" onClick={() => alert('Download XML')}>
                      <FileCode className="mr-2 h-4 w-4" />
                      Baixar XML
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.status === 'Para Emitir' ? (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handleEmitInvoice}
                      disabled={emitInvoiceMutation.isPending}
                    >
                      {emitInvoiceMutation.isPending ? 'Emitindo...' : 'Gerar NF-e'}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-blue-800 bg-blue-100/50 p-3 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      O pedido deve estar em "Para Emitir" para gerar a nota.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
