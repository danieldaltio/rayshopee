'use client';

import { Button } from '@/components/ui/button';
import { Receipt, RefreshCw, X } from 'lucide-react';
import { useEmitInvoiceBatch } from '@/hooks/use-invoices';

interface BatchActionsBarProps {
  selectedOrderIds: string[];
  onClearSelection: () => void;
  onSuccess?: () => void;
}

export function BatchActionsBar({ selectedOrderIds, onClearSelection, onSuccess }: BatchActionsBarProps) {
  const batchMutation = useEmitInvoiceBatch();

  if (selectedOrderIds.length === 0) {
    return null;
  }

  const handleEmitBatch = async () => {
    try {
      const result = await batchMutation.mutateAsync(selectedOrderIds);
      if (onSuccess) {
        onSuccess();
      }
      onClearSelection();
      
      // We could use a standard toast library here if configured.
      // For now, we rely on the parent or we just clear selection.
      alert(`Emissão em lote finalizada!\nSucesso: ${result.success}\nFalhas: ${result.failed}`);
    } catch (error) {
      console.error('Failed to emit batch', error);
      alert('Erro ao tentar emitir o lote. Verifique o console.');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 border border-slate-700 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-slate-800 text-sm font-semibold px-3 py-1 rounded-full border border-slate-700">
          {selectedOrderIds.length}
        </div>
        <span className="text-sm font-medium">Pedidos selecionados</span>
      </div>

      <div className="h-6 w-px bg-slate-700" />

      <div className="flex items-center gap-3">
        <Button
          onClick={handleEmitBatch}
          disabled={batchMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
          size="sm"
        >
          {batchMutation.isPending ? (
            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Emitindo Lote...</>
          ) : (
            <><Receipt className="mr-2 h-4 w-4" /> Emitir NF-e e Enviar</>
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          disabled={batchMutation.isPending}
          className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
