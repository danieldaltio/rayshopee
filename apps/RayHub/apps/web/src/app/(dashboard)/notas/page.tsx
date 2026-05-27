'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Download, FileCode } from 'lucide-react';
import { useInvoices } from '@/hooks/use-invoices';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function NotasPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const take = 10;

  const { invoices, meta, isLoading } = useInvoices(take, page * take, search);

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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notas Fiscais</h1>
          <p className="text-sm text-gray-500">
            Gerencie as NFs emitidas, baixe XML e PDFs.
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar por Nº Pedido, Cliente, Nota..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número / Série</TableHead>
                <TableHead>Pedido Shopee</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Arquivos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Carregando notas fiscais...
                  </TableCell>
                </TableRow>
              ) : invoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhuma nota fiscal encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                invoices?.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.numero} / {invoice.serie}
                    </TableCell>
                    <TableCell>
                      <Link href={`/pedidos/${invoice.order_id}`} className="text-blue-600 hover:underline">
                        {invoice.order?.shopee_order_sn || '-'}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.order?.customer?.name || '-'}</TableCell>
                    <TableCell>
                      {new Date(invoice.emitida_em).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'AUTHORIZED' ? 'default' : 'secondary'}>
                        {invoice.status === 'AUTHORIZED' ? 'Autorizada' : invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.order?.total || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Baixar XML"
                          onClick={() => alert(`Download XML: ${invoice.xml_url}`)}
                        >
                          <FileCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Baixar PDF (DANFE)"
                          onClick={() => alert(`Download PDF: ${invoice.danfe_pdf_url}`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
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
              disabled={!invoices || invoices.length < take}
            >
              Próxima
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
