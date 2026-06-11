import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ShopeeService } from './shopee.service';
export declare class ShopeeSyncProcessor extends WorkerHost {
    private readonly shopeeService;
    private readonly eventEmitter;
    private readonly logger;
    constructor(shopeeService: ShopeeService, eventEmitter: EventEmitter2);
    process(job: Job<{
        companyId: string;
    }, any, string>): Promise<any>;
    onCompleted(job: Job): void;
    onFailed(job: Job, error: Error): void;
}
