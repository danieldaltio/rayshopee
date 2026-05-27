'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useProductFormStore } from '@/store/useProductFormStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const productSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  sku: z.string().optional(),
  shopee_price: z.coerce.number().positive('Preço deve ser maior que zero'),
  cost: z.coerce.number().min(0, 'Custo não pode ser negativo').default(0),
  shopee_stock: z.coerce.number().min(0).default(0),
  ncm: z.string().length(8, 'NCM deve ter exatamente 8 dígitos').regex(/^\d{8}$/, 'NCM só pode conter números'),
  cfop: z.string().length(4, 'CFOP deve ter exatamente 4 dígitos').regex(/^\d{4}$/, 'CFOP só pode conter números'),
  unidade: z.string().default('UN'),
  estoque_minimo: z.coerce.number().min(0).default(0),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProdutoFormPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = params.id === 'novo';

  const { setField, getMargin, reset } = useProductFormStore();

  const { data: product, isLoading: isFetching } = useQuery({
    queryKey: ['product', params.id],
    queryFn: async () => {
      if (isNew) return null;
      const res = await api.get(`/products/${params.id}`);
      return res.data;
    },
    enabled: !isNew,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      sku: '',
      shopee_price: 0,
      cost: 0,
      shopee_stock: 0,
      ncm: '',
      cfop: '',
      unidade: 'UN',
      estoque_minimo: 0,
    },
  });

  useEffect(() => {
    if (product && !isNew) {
      form.reset({
        name: product.name,
        sku: product.sku || '',
        shopee_price: Number(product.shopee_price),
        cost: Number(product.cost),
        shopee_stock: product.shopee_stock,
        ncm: product.ncm || '',
        cfop: product.cfop || '',
        unidade: product.unidade || 'UN',
        estoque_minimo: product.estoque_minimo || 0,
      });
      setField('shopeePrice', Number(product.shopee_price));
      setField('cost', Number(product.cost));
    } else {
      reset();
    }
  }, [product, isNew, form, setField, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      if (isNew) {
        return api.post('/products', data);
      }
      return api.put(`/products/${params.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/produtos');
    },
  });

  function onSubmit(data: ProductFormValues) {
    mutation.mutate(data);
  }

  const { lucroAbsoluto, margemPercent } = getMargin();

  if (isFetching) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/produtos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {isNew ? 'Novo Produto' : 'Editar Produto'}
          </h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Dados Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Dados Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Camisa Polo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="CAM-POLO-AZ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade Comercial</FormLabel>
                        <FormControl>
                          <Input placeholder="UN" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shopee_stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Disponível</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estoque_minimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Mínimo</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Precificação e Fiscal */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Precificação</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shopee_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda (Shopee) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setField('shopeePrice', Number(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setField('cost', Number(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fiscal (Obrigatório para NF-e)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ncm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NCM * (8 dígitos)</FormLabel>
                        <FormControl>
                          <Input placeholder="00000000" maxLength={8} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cfop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CFOP Padrão * (4 dígitos)</FormLabel>
                        <FormControl>
                          <Input placeholder="5102" maxLength={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Bar (Fixed at bottom) */}
          <div className="fixed bottom-0 left-60 right-0 p-4 bg-white border-t flex items-center justify-between shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Lucro Líquido Est.</span>
                <span className={`font-bold text-lg ${lucroAbsoluto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {lucroAbsoluto.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Margem</span>
                <span className={`font-bold text-lg ${margemPercent >= 10 ? 'text-green-600' : margemPercent > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {margemPercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-400 max-w-[200px]">
                * Calculado com taxa padrão Shopee de 15%
              </div>
            </div>
            
            <Button type="submit" size="lg" disabled={mutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {mutation.isPending ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
