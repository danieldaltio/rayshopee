'use client';

import { useState } from 'react';
import { useInventorySummary, useInventoryLocations } from '@/hooks/use-inventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PackageSearch, AlertTriangle, Layers, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EstoquePage() {
  const { data: summary, isLoading: isLoadingSummary } = useInventorySummary();
  const { data: locations, isLoading: isLoadingLocations } = useInventoryLocations();

  if (isLoadingSummary || isLoadingLocations) {
    return <div className="p-6 text-slate-500">Carregando painel de estoque WMS...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Módulo de Estoque e WMS</h1>
        <p className="text-sm text-slate-500">Gestão física de corredores e prateleiras (Kardex)</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Estoque Total */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-blue-800">
                Total Disponível (Venda)
              </CardTitle>
            </div>
            <Layers className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {summary?.totalAvailable || 0}
              <span className="text-sm font-normal text-blue-700 ml-1">unidades</span>
            </div>
            <p className="text-xs text-blue-600/80 mt-1">Sincronizado com a Shopee</p>
          </CardContent>
        </Card>

        {/* Local: Estoque Principal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-slate-700">
                {locations?.main?.name || 'Estoque Principal'}
              </CardTitle>
            </div>
            <PackageSearch className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              Físico
            </div>
            <p className="text-xs text-slate-500 mt-1">Produtos prontos para picking</p>
          </CardContent>
        </Card>

        {/* Local: Defeitos / Avarias */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-red-800">
                {locations?.defect?.name || 'Estoque Defeito'}
              </CardTitle>
            </div>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              Avarias
            </div>
            <p className="text-xs text-red-600/80 mt-1">Fora da vitrine (Quarentena)</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Ações Rápidas</h2>
        <div className="flex space-x-4 mt-4">
          <Button variant="outline" className="gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Transferir para Defeito
          </Button>
          <Button variant="outline" className="gap-2">
            <Layers className="w-4 h-4" />
            Ajuste de Kardex Manual
          </Button>
        </div>
        <p className="text-sm text-slate-500 mt-4 max-w-2xl">
          Nesta etapa inicial do WMS, ao realizar uma entrada ou saída do estoque principal, a Shopee é automaticamente atualizada.
          Transferências para o estoque de defeito removem o item da vitrine.
        </p>
      </div>
    </div>
  );
}
