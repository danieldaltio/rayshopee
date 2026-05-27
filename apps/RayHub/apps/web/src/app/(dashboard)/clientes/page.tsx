'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit } from 'lucide-react';
import { useCustomers } from '@/hooks/use-customers';

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

export default function ClientesPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const take = 10;

  const { customers, meta, isLoading } = useCustomers(take, page * take, search);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">
            Gerencie sua base de clientes e informações para faturamento.
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar por nome, CPF ou CNPJ..."
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
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Username Shopee</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Carregando clientes...
                  </TableCell>
                </TableRow>
              ) : customers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum cliente cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                customers?.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.cpf_cnpj || '-'}</TableCell>
                    <TableCell>{customer.shopee_buyer_username || '-'}</TableCell>
                    <TableCell>
                      {customer.endereco_cidade}
                      {customer.endereco_cidade && customer.endereco_uf ? ' / ' : ''}
                      {customer.endereco_uf}
                      {!customer.endereco_cidade && !customer.endereco_uf && '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/clientes/${customer.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
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
              disabled={!customers || customers.length < take}
            >
              Próxima
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
