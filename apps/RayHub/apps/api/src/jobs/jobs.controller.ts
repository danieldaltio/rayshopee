import { Controller, Sse } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map, filter } from 'rxjs';
import { getCurrentTenantId } from '../common/tenant/tenant.context';

export interface JobEvent {
  jobId: string;
  companyId: string;
  status: 'progress' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
  type: string; // ex: 'sync-orders', 'emit-batch'
}

@Controller('jobs')
export class JobsController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Sse('stream')
  streamEvents(): Observable<MessageEvent> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant ID is required for SSE');
    }

    return fromEvent(this.eventEmitter, 'job.updated').pipe(
      filter((payload: JobEvent) => payload.companyId === tenantId),
      map((payload: JobEvent) => ({
        data: payload,
      } as MessageEvent)),
    );
  }
}
