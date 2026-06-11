import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
export interface JobEvent {
    jobId: string;
    companyId: string;
    status: 'progress' | 'completed' | 'failed';
    progress?: number;
    result?: any;
    error?: string;
    type: string;
}
export declare class JobsController {
    private readonly eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    streamEvents(): Observable<MessageEvent>;
}
