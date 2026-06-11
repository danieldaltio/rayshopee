"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InvoiceProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const invoices_service_1 = require("./invoices.service");
const tenant_context_1 = require("../common/tenant/tenant.context");
let InvoiceProcessor = InvoiceProcessor_1 = class InvoiceProcessor extends bullmq_1.WorkerHost {
    invoicesService;
    eventEmitter;
    logger = new common_1.Logger(InvoiceProcessor_1.name);
    constructor(invoicesService, eventEmitter) {
        super();
        this.invoicesService = invoicesService;
        this.eventEmitter = eventEmitter;
    }
    async process(job) {
        const { companyId, orderIds } = job.data;
        this.logger.log(`Iniciando Job de Emissão em Lote [${job.id}] - Company: ${companyId} - Ordens: ${orderIds.length}`);
        return (0, tenant_context_1.runWithTenant)(companyId, async () => {
            try {
                if (job.name === 'emit-batch') {
                    this.eventEmitter.emit('job.updated', { jobId: job.id, companyId, status: 'progress', progress: 10, type: job.name });
                    const result = await this.invoicesService.emitInvoiceBatch(orderIds);
                    await job.updateProgress(100);
                    this.eventEmitter.emit('job.updated', { jobId: job.id, companyId, status: 'progress', progress: 100, type: job.name });
                    return result;
                }
                throw new Error(`Job name ${job.name} desconhecido na invoice-queue`);
            }
            catch (error) {
                this.logger.error(`Erro no Job de NFe [${job.id}]: ${error.message}`);
                throw error;
            }
        });
    }
    onCompleted(job) {
        this.logger.log(`Lote de notas ${job.id} processado. Resultado: ${JSON.stringify(job.returnvalue)}`);
        this.eventEmitter.emit('job.updated', {
            jobId: job.id,
            companyId: job.data.companyId,
            status: 'completed',
            result: job.returnvalue,
            type: job.name
        });
    }
    onFailed(job, error) {
        this.logger.error(`Lote de notas ${job.id} falhou drasticamente: ${error.message}`);
        this.eventEmitter.emit('job.updated', {
            jobId: job.id,
            companyId: job.data.companyId,
            status: 'failed',
            error: error.message,
            type: job.name
        });
    }
};
exports.InvoiceProcessor = InvoiceProcessor;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], InvoiceProcessor.prototype, "onCompleted", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job, Error]),
    __metadata("design:returntype", void 0)
], InvoiceProcessor.prototype, "onFailed", null);
exports.InvoiceProcessor = InvoiceProcessor = InvoiceProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('invoice-queue'),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService,
        event_emitter_1.EventEmitter2])
], InvoiceProcessor);
//# sourceMappingURL=invoice.processor.js.map