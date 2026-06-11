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
var ShopeeSyncProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopeeSyncProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const shopee_service_1 = require("./shopee.service");
const tenant_context_1 = require("../common/tenant/tenant.context");
let ShopeeSyncProcessor = ShopeeSyncProcessor_1 = class ShopeeSyncProcessor extends bullmq_1.WorkerHost {
    shopeeService;
    eventEmitter;
    logger = new common_1.Logger(ShopeeSyncProcessor_1.name);
    constructor(shopeeService, eventEmitter) {
        super();
        this.shopeeService = shopeeService;
        this.eventEmitter = eventEmitter;
    }
    async process(job) {
        const { companyId } = job.data;
        this.logger.log(`Iniciando Job de Sincronização Shopee [${job.id}] - Company: ${companyId} - Tipo: ${job.name}`);
        return (0, tenant_context_1.runWithTenant)(companyId, async () => {
            try {
                if (job.name === 'sync-orders') {
                    this.logger.log('Sincronizando pedidos...');
                    const progressCallback = async (p) => {
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
                    const progressCallback = async (p) => {
                        await job.updateProgress(p);
                        this.eventEmitter.emit('job.updated', { jobId: job.id, companyId, status: 'progress', progress: p, type: job.name });
                    };
                    await progressCallback(10);
                    const products = await this.shopeeService.syncProducts();
                    await progressCallback(100);
                    return { success: true, count: products || 0 };
                }
                throw new Error(`Job name ${job.name} desconhecido`);
            }
            catch (error) {
                this.logger.error(`Erro no Job [${job.id}]: ${error.message}`);
                throw error;
            }
        });
    }
    onCompleted(job) {
        this.logger.log(`Job ${job.id} concluído com sucesso. Resultado: ${JSON.stringify(job.returnvalue)}`);
        this.eventEmitter.emit('job.updated', {
            jobId: job.id,
            companyId: job.data.companyId,
            status: 'completed',
            result: job.returnvalue,
            type: job.name
        });
    }
    onFailed(job, error) {
        this.logger.error(`Job ${job.id} falhou. Motivo: ${error.message}`);
        this.eventEmitter.emit('job.updated', {
            jobId: job.id,
            companyId: job.data.companyId,
            status: 'failed',
            error: error.message,
            type: job.name
        });
    }
};
exports.ShopeeSyncProcessor = ShopeeSyncProcessor;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], ShopeeSyncProcessor.prototype, "onCompleted", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job, Error]),
    __metadata("design:returntype", void 0)
], ShopeeSyncProcessor.prototype, "onFailed", null);
exports.ShopeeSyncProcessor = ShopeeSyncProcessor = ShopeeSyncProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('shopee-sync'),
    __metadata("design:paramtypes", [shopee_service_1.ShopeeService,
        event_emitter_1.EventEmitter2])
], ShopeeSyncProcessor);
//# sourceMappingURL=shopee-sync.processor.js.map