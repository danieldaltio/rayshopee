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
exports.MockInjectOrderDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class MockCustomerDto {
    name;
    cpf_cnpj;
    shopee_buyer_username;
    endereco_rua;
    endereco_numero;
    endereco_cidade;
    endereco_uf;
    endereco_cep;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockCustomerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockCustomerDto.prototype, "cpf_cnpj", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockCustomerDto.prototype, "shopee_buyer_username", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockCustomerDto.prototype, "endereco_rua", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockCustomerDto.prototype, "endereco_numero", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockCustomerDto.prototype, "endereco_cidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockCustomerDto.prototype, "endereco_uf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockCustomerDto.prototype, "endereco_cep", void 0);
class MockOrderItemDto {
    product_id;
    quantidade;
    preco_unitario;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockOrderItemDto.prototype, "product_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MockOrderItemDto.prototype, "quantidade", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MockOrderItemDto.prototype, "preco_unitario", void 0);
class MockInjectOrderDto {
    shopee_order_sn;
    status;
    subtotal;
    frete;
    desconto;
    total;
    shopee_comissao;
    customer;
    items;
}
exports.MockInjectOrderDto = MockInjectOrderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockInjectOrderDto.prototype, "shopee_order_sn", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MockInjectOrderDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MockInjectOrderDto.prototype, "subtotal", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MockInjectOrderDto.prototype, "frete", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MockInjectOrderDto.prototype, "desconto", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MockInjectOrderDto.prototype, "total", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MockInjectOrderDto.prototype, "shopee_comissao", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MockCustomerDto),
    __metadata("design:type", MockCustomerDto)
], MockInjectOrderDto.prototype, "customer", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MockOrderItemDto),
    __metadata("design:type", Array)
], MockInjectOrderDto.prototype, "items", void 0);
//# sourceMappingURL=mock-inject.dto.js.map