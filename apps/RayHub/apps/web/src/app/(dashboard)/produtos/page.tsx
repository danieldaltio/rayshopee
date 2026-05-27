'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, RefreshCw, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';
import api from '@/lib/api';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  sku: string;
  shopee_price: number;
  cost: number;
  shopee_stock: number;
  ncm: string | null;
  cfop: string | null;
  is_active: boolean;
}

// Componente de célula com edição inline
function InlineEditCell({
  value,
  productId,
  field,
  placeholder,
  maxLength,
  pattern,
}: {
  value: string | null;
  productId: string;
  field: 'ncm' | 'cfop';
  placeholder: string;
  maxLength: number;
  pattern?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const isEmpty = !value || value.trim() === '';

  const handleSave = async () => {
    if (localValue === (value || '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await api.put(`/products/${productId}`, { [field]: localValue || null });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSavedOk(true);
      setTimeout(() => setSavedOk(null), 2000);
    } catch {
      setSavedOk(false);
      setTimeout(() => setSavedOk(null), 3000);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value.replace(/\D/g, ''))}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') { setLocalValue(value || ''); setEditing(false); }
        }}
        maxLength={maxLength}
        pattern={pattern}
        placeholder={placeholder}
        className="h-7 w-28 text-xs font-mono px-2"
      />
    );
  }

  return (
    <button
      onClick={() => { setEditing(true); }}
      title="Clique para editar"
      className="group flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-gray-100 transition-colors min-w-[80px]"
    >
      {saving ? (
        <span className="text-xs text-gray-400 italic">Salvando...</span>
      ) : savedOk === true ? (
        <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3 w-3" />Salvo</span>
      ) : savedOk === false ? (
        <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />Erro</span>
      ) : isEmpty ? (
        <span className="text-xs text-orange-500 font-medium italic">— preencher</span>
      ) : (
        <span className="font-mono text-xs text-gray-800">{value}</span>
      )}
      <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default function ProdutosPage() {
  const [page, setPage] = useState(0);
  const take = 10;
  const queryClient = useQueryClient();
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSource, setImportSource] = useState<'bling' | 'upseller'>('upseller');
  const [importFile, setImportFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page],
    queryFn: async () => {
      const res = await api.get(`/products?take=${take}&skip=${page * take}`);
      return res.data;
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!importFile) throw new Error('Nenhum arquivo selecionado.');
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('source', importSource);
      
      const res = await api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setImportModalOpen(false);
      setImportFile(null);
      alert(`Importação concluída! ${data.updated} atualizados, ${data.notFound} não encontrados no RayHub.`);
    },
    onError: (error: any) => {
      alert(`Erro na importação: ${error.response?.data?.message || error.message}`);
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/products/sync');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert(`Sincronização concluída! ${data.count} produtos atualizados.`);
    },
    onError: (error: any) => {
      alert(`Erro na sincronização: ${error.response?.data?.message || error.message}`);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">
            Gerencie seu catálogo e informações fiscais.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UploadCloud className="mr-2 h-4 w-4" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Produtos</DialogTitle>
                <DialogDescription>
                  Faça o upload da planilha exportada do UpSeller ou Bling para atualizar NCMs, Preços de Custo e Pesos automaticamente pelo SKU.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Origem do Arquivo</label>
                  <Select value={importSource} onValueChange={(v: any) => setImportSource(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upseller">UpSeller (Excel/CSV)</SelectItem>
                      <SelectItem value="bling">Bling (Excel/CSV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Arquivo (.csv)</label>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Exporte sua planilha no formato CSV. UpSeller (Produtos -&gt; Exportar) ou Bling (Cadastros -&gt; Produtos -&gt; Exportar).
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setImportModalOpen(false)}>Cancelar</Button>
                <Button 
                  onClick={() => importMutation.mutate()} 
                  disabled={!importFile || importMutation.isPending}
                >
                  {importMutation.isPending ? 'Importando...' : 'Iniciar Importação'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={() => syncMutation.mutate()} 
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> 
            {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Shopee'}
          </Button>
          <Link href="/produtos/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar por nome ou SKU..."
              className="pl-9"
            />
          </div>
          {data && (
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
              {(() => {
                const total = data.data.length;
                const withNcm = data.data.filter((p: Product) => p.ncm && p.ncm.length === 8).length;
                const pct = total > 0 ? Math.round((withNcm / total) * 100) : 0;
                return (
                  <>
                    <span className="hidden sm:inline">NCM preenchido:</span>
                    <Badge variant={pct === 100 ? 'default' : pct > 50 ? 'secondary' : 'destructive'}>
                      {withNcm}/{total} ({pct}%)
                    </Badge>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Preço Shopee</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead title="Clique para editar inline">NCM ✎</TableHead>
                <TableHead title="Clique para editar inline">CFOP ✎</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Carregando produtos...
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Nenhum produto cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={product.name}>
                      {product.name}
                    </TableCell>
                    <TableCell className="text-gray-500">{product.sku || '-'}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(product.shopee_price))}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(product.cost))}
                    </TableCell>
                    <TableCell>{product.shopee_stock}</TableCell>
                    <TableCell>
                      <InlineEditCell
                        value={product.ncm}
                        productId={product.id}
                        field="ncm"
                        placeholder="00000000"
                        maxLength={8}
                        pattern="\d{8}"
                      />
                    </TableCell>
                    <TableCell>
                      <InlineEditCell
                        value={product.cfop}
                        productId={product.id}
                        field="cfop"
                        placeholder="5102"
                        maxLength={4}
                        pattern="\d{4}"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/produtos/${product.id}`}>
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
        <div className="p-4 border-t flex justify-between items-center">
          <p className="text-xs text-gray-400">
            💡 Clique diretamente nos campos <strong>NCM</strong> ou <strong>CFOP</strong> para editar. Pressione Enter ou clique fora para salvar.
          </p>
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
              Página {page + 1} de {data?.meta?.total ? Math.ceil(data.meta.total / take) : 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || data.data.length < take}
            >
              Próxima
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
