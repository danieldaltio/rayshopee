'use client';

import React from 'react';
import { useJobTrackerStore } from '@/hooks/use-job-tracker';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GlobalLoader() {
  const { activeJobs, hasActiveJobs } = useJobTrackerStore();

  if (!hasActiveJobs) return null;

  const jobs = Object.values(activeJobs);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-12 sm:pb-24 pointer-events-none">
      <div className="flex flex-col gap-3 w-full max-w-sm px-4">
        {jobs.map((job) => {
          const title = 
            job.type === 'sync-orders' ? 'Sincronizando Pedidos...' :
            job.type === 'sync-products' ? 'Sincronizando Produtos...' :
            job.type === 'emit-batch' ? 'Emitindo Lote de NFe...' :
            'Processando...';

          return (
            <div
              key={job.jobId}
              className={cn(
                "w-full bg-white/70 dark:bg-black/70 backdrop-blur-md",
                "border border-slate-200 dark:border-slate-800 shadow-xl",
                "rounded-xl p-4 pointer-events-auto transform transition-all duration-300 animate-in slide-in-from-bottom-5"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {title}
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary">
                  {job.progress || 0}%
                </span>
              </div>
              
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${job.progress || 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
