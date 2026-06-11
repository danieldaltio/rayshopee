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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const rxjs_1 = require("rxjs");
const tenant_context_1 = require("../common/tenant/tenant.context");
let JobsController = class JobsController {
    eventEmitter;
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    streamEvents() {
        const tenantId = (0, tenant_context_1.getCurrentTenantId)();
        if (!tenantId) {
            throw new Error('Tenant ID is required for SSE');
        }
        return (0, rxjs_1.fromEvent)(this.eventEmitter, 'job.updated').pipe((0, rxjs_1.filter)((payload) => payload.companyId === tenantId), (0, rxjs_1.map)((payload) => ({
            data: payload,
        })));
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Sse)('stream'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", rxjs_1.Observable)
], JobsController.prototype, "streamEvents", null);
exports.JobsController = JobsController = __decorate([
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map