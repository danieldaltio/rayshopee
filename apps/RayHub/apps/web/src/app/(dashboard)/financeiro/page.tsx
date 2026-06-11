'use client';

import { useState } from 'react';
import { useFinanceSummary, useFinanceAccounts, useFinanceWithdraw } from '@/hooks/use-finance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, Landmark, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function FinanceiroPage() {
  const [date, setDate] = useState(new Date());
  
  const { data: summary, isLoading: isLoadingSummary } = useFinanceSummary(date.getFullYear(), date.getMonth() + 1);
  const { data: accounts, isLoading: isLoadingAccounts } = useFinanceAccounts();
  const withdraw = useFinanceWithdraw();

  const handleWithdraw = async () => {
    if (!accounts?.wallet?.current_balance || Number(accounts.wallet.current_balance) <= 0) {
      toast.error('Saldo insuficiente para saque');
      return;
    }

    try {
      await withdraw.mutateAsync(Number(accounts.wallet.current_balance));
      toast.success('Saque/Repasse realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao realizar saque');
    }
  };

  const formatCurrency = (val: number | string | undefined) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val || 0));
  };

  if (isLoadingSummary || isLoadingAccounts) {
    return <div className="p-6 text-slate-500">Carregando painel financeiro...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Módulo Financeiro</h1>
        <p className="text-sm text-slate-500">Acompanhe seu fluxo de caixa e repasses (DRE Simplificada)</p>
      </div>

      {/* Visão Geral do Caixa */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Conta Saldo Shopee (Wallet) */}
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-orange-800">
                Saldo na Shopee (A Receber)
              </CardTitle>
              <CardDescription className="text-orange-600/80 text-xs">
                Valores de vendas sincronizadas ainda não repassadas.
              </CardDescription>
            </div>
            <Wallet className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(accounts?.wallet?.current_balance)}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-100">
                Atualizado automático
              </Badge>
              <Button 
                size="sm" 
                variant="default" 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleWithdraw}
                disabled={withdraw.isPending || Number(accounts?.wallet?.current_balance) <= 0}
              >
                {withdraw.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Landmark className="mr-2 h-4 w-4" />}
                Registrar Saque
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conta Corrente (Física) */}
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-emerald-800">
                Conta Bancária (Caixa Livre)
              </CardTitle>
              <CardDescription className="text-emerald-600/80 text-xs">
                Saldo físico disponível em sua conta após saques.
              </CardDescription>
            </div>
            <Landmark className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {formatCurrency(accounts?.checking?.current_balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRE Simplificada */}
      <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-8 mb-4">
        DRE do Mês — {date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
      </h2>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary?.gross_revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxas Shopee</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary?.shopee_fees)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deduções</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary?.total_expenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-none text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Lucro Bruto</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(summary?.net_profit)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Margem: {summary?.profit_margin?.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
