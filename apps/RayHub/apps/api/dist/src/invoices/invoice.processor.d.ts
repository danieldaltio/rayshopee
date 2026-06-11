import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoicesService } from './invoices.service';
export declare class InvoiceProcessor extends WorkerHost {
    private readonly invoicesService;
    private readonly eventEmitter;
    private readonly logger;
    constructor(invoicesService: InvoicesService, eventEmitter: EventEmitter2);
    process(job: Job<{
        companyId: string;
        orderIds: string[];
    }, any, string>): Promise<any>;
    onCompleted(job: Job): void;
    onFailed(job: Job, error: Error): void;
}
