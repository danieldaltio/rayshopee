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
exports.UpsertCompanyDto = exports.RegimeTributario = void 0;
const class_validator_1 = require("class-validator");
var RegimeTributario;
(function (RegimeTributario) {
    RegimeTributario["SIMPLES"] = "Simples Nacional";
    RegimeTributario["LUCRO_PRESUMIDO"] = "Lucro Presumido";
    RegimeTributario["LUCRO_REAL"] = "Lucro Real";
    RegimeTributario["MEI"] = "MEI";
})(RegimeTributario || (exports.RegimeTributario = RegimeTributario = {}));
class UpsertCompanyDto {
    razao_social;
    nome_fantasia;
    cnpj;
    ie;
    im;
    regime_tributario;
    endereco_cep;
    endereco_rua;
    endereco_numero;
    endereco_complemento;
    endereco_bairro;
    endereco_cidade;
    endereco_uf;
    certificado_digital_url;
    certificado_senha_hash;
    logo_url;
    nfe_serie;
    nfe_proximo_numero;
    nfe_ambiente;
    nfe_provedor;
    imposto_calculo_tipo;
    cst_csosn_padrao;
    cst_pis_cofins;
    aliquota_simples;
    impostos_config;
    certificado_base64;
}
exports.UpsertCompanyDto = UpsertCompanyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "razao_social", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "nome_fantasia", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(14, 14, { message: 'CNPJ deve ter 14 dígitos (sem pontuação)' }),
    (0, class_validator_1.Matches)(/^\d{14}$/, { message: 'CNPJ deve conter apenas números' }),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "cnpj", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "ie", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "im", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RegimeTributario),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "regime_tributario", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "endereco_cep", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "endereco_rua", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "endereco_numero", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "endereco_complemento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "endereco_bairro", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "endereco_cidade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "endereco_uf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "certificado_digital_url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "certificado_senha_hash", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "logo_url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "nfe_serie", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpsertCompanyDto.prototype, "nfe_proximo_numero", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "nfe_ambiente", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "nfe_provedor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "imposto_calculo_tipo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "cst_csosn_padrao", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "cst_pis_cofins", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpsertCompanyDto.prototype, "aliquota_simples", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpsertCompanyDto.prototype, "impostos_config", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanyDto.prototype, "certificado_base64", void 0);
//# sourceMappingURL=upsert-company.dto.js.map