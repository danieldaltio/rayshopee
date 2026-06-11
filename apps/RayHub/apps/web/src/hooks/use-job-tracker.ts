import { useEffect } from 'react';
import { create } from 'zustand';
import { toast } from 'sonner';

export interface JobEvent {
  jobId: string;
  companyId: string;
  status: 'progress' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
  type: string;
}

interface JobTrackerState {
  activeJobs: Record<string, JobEvent>;
  addJob: (jobId: string, type: string) => void;
  updateJob: (event: JobEvent) => void;
  removeJob: (jobId: string) => void;
  hasActiveJobs: boolean;
}

export const useJobTrackerStore = create<JobTrackerState>((set) => ({
  activeJobs: {},
  hasActiveJobs: false,
  
  addJob: (jobId, type) => set((state) => {
    const newJobs = { ...state.activeJobs, [jobId]: { jobId, type, status: 'progress', companyId: '', progress: 0 } };
    return { activeJobs: newJobs, hasActiveJobs: Object.keys(newJobs).length > 0 };
  }),

  updateJob: (event) => set((state) => {
    // Só atualiza se o job existir na store (o usuário iniciou nesta sessão)
    if (!state.activeJobs[event.jobId]) return state;

    const newJobs = { ...state.activeJobs };
    
    if (event.status === 'completed' || event.status === 'failed') {
      delete newJobs[event.jobId];
    } else {
      newJobs[event.jobId] = { ...newJobs[event.jobId], ...event };
    }

    return { activeJobs: newJobs, hasActiveJobs: Object.keys(newJobs).length > 0 };
  }),

  removeJob: (jobId) => set((state) => {
    const newJobs = { ...state.activeJobs };
    delete newJobs[jobId];
    return { activeJobs: newJobs, hasActiveJobs: Object.keys(newJobs).length > 0 };
  }),
}));

export function useJobTrackerSSE() {
  const updateJob = useJobTrackerStore((state) => state.updateJob);

  useEffect(() => {
    // Usando URL relativa (assumindo que há um proxy no Next.js configurado ou enviando via fetch wrapper)
    // No entanto, EventSource não aceita headers de Authorization (como Bearer JWT) nativamente.
    // Para simplificar, o Supabase no web já guarda a sessão via cookies. 
    // Se a API não ler cookies, precisamos passar via query param.
    // Vamos assumir acesso direto por hora.
    
    // Importante: No mundo real com JWT, usaríamos uma lib como `@microsoft/fetch-event-source`.
    // Como simplificação para o contexto do RayHub, usaremos EventSource padrão,
    // que envia os cookies do domínio.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const eventSource = new EventSource(`${apiUrl}/jobs/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const data: JobEvent = JSON.parse(event.data);
        updateJob(data);

        // Dispara Toasts quando terminar!
        if (data.status === 'completed') {
          const name = data.type === 'sync-orders' ? 'Sincronização de Pedidos' 
                     : data.type === 'sync-products' ? 'Sincronização de Produtos'
                     : data.type === 'emit-batch' ? 'Emissão em Lote'
                     : 'Operação';
          toast.success(`${name} concluída com sucesso!`);
        }
        
        if (data.status === 'failed') {
          toast.error(`Falha no Job ${data.type}: ${data.error}`);
        }
      } catch (err) {
        console.error('Erro ao fazer parse do evento SSE', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      // fallback: se der erro, reconecta silenciosamente
    };

    return () => {
      eventSource.close();
    };
  }, [updateJob]);
}
