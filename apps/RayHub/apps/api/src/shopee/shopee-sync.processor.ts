import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ShopeeService } from './shopee.service';
import { runWithTenant } from '../common/tenant/tenant.context';

@Processor('shopee-sync')
export class ShopeeSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ShopeeSyncProcessor.name);

  constructor(
    private readonly shopeeService: ShopeeService,
    private readonly eventEmitter: EventEmitter2
  ) {
    super();
  }

  async process(job: Job<{ companyId: string }, any, string>): Promise<any> {
    const { companyId } = job.data;
    
    this.logger.log(`Iniciando Job de Sincronização Shopee [${job.id}] - Company: ${companyId} - Tipo: ${job.name}`);

    // Como o processamento acontece fora de um Request HTTP, nós envelopamos
    // a execução com o tenant_id manualmente usando AsyncLocalStorage
    return runWithTenant(companyId, async () => {
      try {
        if (job.name === 'sync-orders') {
          this.logger.log('Sincronizando pedidos...');
          
          const progressCallback = async (p: number) => {
            await job.updateProgress(p);
            this.eventEmitter.emit('job.updated', { jobId: job.id, companyId, status: 'progress', progress: p, type: job.name });
          };

          await progressCallback(10);
          const orders = await this.shopeeService.syncOrders();
          await progressCallback(100);
          return { success: true, count: orders || 0 };
        }
        
        if (job.name === 'sync-products') {
          this.logger.log('Sincronizando produtos...');

          const progressCallback = async (p: number) => {
            await job.updateProgress(p);
            this.eventEmitter.emit('job.updated', { jobId: job.id, companyId, status: 'progress', progress: p, type: job.name });
          };

          await progressCallback(10);
          const products = await this.shopeeService.syncProducts();
          await progressCallback(100);
          return { success: true, count: products || 0 };
        }

        throw new Error(`Job name ${job.name} desconhecido`);
      } catch (error: any) {
        this.logger.error(`Erro no Job [${job.id}]: ${error.message}`);
        throw error;
      }
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} concluído com sucesso. Resultado: ${JSON.stringify(job.returnvalue)}`);
    this.eventEmitter.emit('job.updated', { 
      jobId: job.id, 
      companyId: job.data.companyId, 
      status: 'completed', 
      result: job.returnvalue, 
      type: job.name 
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} falhou. Motivo: ${error.message}`);
    this.eventEmitter.emit('job.updated', { 
      jobId: job.id, 
      companyId: job.data.companyId, 
      status: 'failed', 
      error: error.message, 
      type: job.name 
    });
  }
}
