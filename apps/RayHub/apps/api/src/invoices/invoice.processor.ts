import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoicesService } from './invoices.service';
import { runWithTenant } from '../common/tenant/tenant.context';

@Processor('invoice-queue')
export class InvoiceProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceProcessor.name);

  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly eventEmitter: EventEmitter2
  ) {
    super();
  }

  async process(job: Job<{ companyId: string, orderIds: string[] }, any, string>): Promise<any> {
    const { companyId, orderIds } = job.data;
    
    this.logger.log(`Iniciando Job de Emissão em Lote [${job.id}] - Company: ${companyId} - Ordens: ${orderIds.length}`);

    return runWithTenant(companyId, async () => {
      try {
        if (job.name === 'emit-batch') {
          this.eventEmitter.emit('job.updated', { jobId: job.id, companyId, status: 'progress', progress: 10, type: job.name });
          const result = await this.invoicesService.emitInvoiceBatch(orderIds);
          await job.updateProgress(100);
          this.eventEmitter.emit('job.updated', { jobId: job.id, companyId, status: 'progress', progress: 100, type: job.name });
          return result;
        }

        throw new Error(`Job name ${job.name} desconhecido na invoice-queue`);
      } catch (error: any) {
        this.logger.error(`Erro no Job de NFe [${job.id}]: ${error.message}`);
        throw error;
      }
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Lote de notas ${job.id} processado. Resultado: ${JSON.stringify(job.returnvalue)}`);
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
    this.logger.error(`Lote de notas ${job.id} falhou drasticamente: ${error.message}`);
    this.eventEmitter.emit('job.updated', { 
      jobId: job.id, 
      companyId: job.data.companyId, 
      status: 'failed', 
      error: error.message, 
      type: job.name 
    });
  }
}
