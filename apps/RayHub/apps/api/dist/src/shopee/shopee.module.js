"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopeeModule = void 0;
const common_1 = require("@nestjs/common");
const shopee_controller_1 = require("./shopee.controller");
const shopee_service_1 = require("./shopee.service");
let ShopeeModule = class ShopeeModule {
};
exports.ShopeeModule = ShopeeModule;
exports.ShopeeModule = ShopeeModule = __decorate([
    (0, common_1.Module)({
        controllers: [shopee_controller_1.ShopeeController],
        providers: [shopee_service_1.ShopeeService],
        exports: [shopee_service_1.ShopeeService],
    })
], ShopeeModule);
//# sourceMappingURL=shopee.module.js.map