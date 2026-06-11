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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FocusNfeService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const cfop_router_1 = require("../common/fiscal/cfop-router");
const cst_selector_1 = require("../common/fiscal/cst-selector");
let FocusNfeService = class FocusNfeService {
    apiUrl;
    token;
    allowMockOnError;
    constructor() {
        const ambiente = process.env.NFE_AMBIENTE || 'homologacao';
        this.apiUrl = ambiente === 'producao'
            ? 'https://api.focusnfe.com.br/v2/nfe'
            : 'https://homologacao.focusnfe.com.br/v2/nfe';
        this.token = process.env.FOCUS_NFE_TOKEN;
        this.allowMockOnError = process.env.NFE_ALLOW_MOCK_ON_ERROR === 'true';
    }
    getHeaders() {
        if (!this.token) {
            console.warn('[FocusNfe] ATENÇÃO: FOCUS_NFE_TOKEN não está definido no .env');
        }
        return {
            Authorization: `Basic ${Buffer.from(this.token + ':').toString('base64')}`,
            'Content-Type': 'application/json',
        };
    }
    async createNfe(order, company) {
        if (!this.token) {
            throw new common_1.InternalServerErrorException('Token da Focus NFe não configurado no .env (FOCUS_NFE_TOKEN).');
        }
        if (!company) {
            throw new common_1.InternalServerErrorException('Dados da empresa emissora não configurados no RayHub.');
        }
        const payload = this.buildFocusPayload(order, company);
        const ref = `RAYHUB_${order.id}`;
        try {
            console.log(`[FocusNfe] Enviando NF-e ref ${ref} para a Sefaz...`);
            console.log(`[FocusNfe] CNPJ emitente: ${payload.emitente.cnpj} | UF: ${payload.emitente.uf}`);
            console.log(`[FocusNfe] Regime: ${payload.emitente.regime_tributario} | Itens: ${payload.itens.length}`);
            const response = await axios_1.default.post(`${this.apiUrl}?ref=${ref}`, payload, {
                headers: this.getHeaders(),
            });
            console.log(`[FocusNfe] Resposta inicial de envio:`, response.data);
            return await this.pollNfeStatus(ref);
        }
        catch (error) {
            console.error(`[FocusNfe] Erro ao enviar NF-e:`, error.response?.data || error.message);
            const errorMessage = error.response?.data?.erros
                ? JSON.stringify(error.response.data.erros)
                : error.message;
            if (this.allowMockOnError && error.response?.status) {
                console.warn(`[FocusNfe] ⚠️ NFE_ALLOW_MOCK_ON_ERROR=true — Simulando emissão para testes.`);
                return {
                    chave_nfe: `43260644156548000109550010000000011${Math.floor(100000000 + Math.random() * 900000000)}`,
                    caminho_xml_nota_fiscal: `https://homologacao.focusnfe.com.br/v2/nfe/${ref}.xml`,
                    caminho_danfe: `https://homologacao.focusnfe.com.br/v2/nfe/${ref}.pdf`,
                    status: 'autorizado',
                    mensagem_sefaz: '[MOCK] Autorizado o uso da NF-e (simulação)',
                };
            }
            throw new common_1.InternalServerErrorException(`Focus NFe Rejeição: ${errorMessage}`);
        }
    }
    async cancelNfe(ref, justificativa) {
        if (!this.token) {
            throw new common_1.InternalServerErrorException('Token da Focus NFe não configurado.');
        }
        if (!justificativa || justificativa.trim().length < 15) {
            throw new common_1.InternalServerErrorException('Justificativa de cancelamento deve ter no mínimo 15 caracteres (exigência SEFAZ).');
        }
        try {
            console.log(`[FocusNfe] Cancelando NF-e ref ${ref}...`);
            const response = await axios_1.default.delete(`${this.apiUrl}/${ref}`, {
                headers: this.getHeaders(),
                data: { justificativa: justificativa.trim() },
            });
            console.log(`[FocusNfe] Resposta de cancelamento:`, response.data);
            return response.data;
        }
        catch (error) {
            console.error(`[FocusNfe] Erro ao cancelar NF-e:`, error.response?.data || error.message);
            const errorMessage = error.response?.data?.erros
                ? JSON.stringify(error.response.data.erros)
                : error.message;
            throw new common_1.InternalServerErrorException(`Erro ao cancelar NF-e: ${errorMessage}`);
        }
    }
    async pollNfeStatus(ref, maxRetries = 5, delayMs = 2000) {
        for (let i = 0; i < maxRetries; i++) {
            await new Promise((res) => setTimeout(res, delayMs));
            try {
                const response = await axios_1.default.get(`${this.apiUrl}/${ref}`, {
                    headers: this.getHeaders(),
                });
                const status = response.data.status;
                console.log(`[FocusNfe] Polling status para ${ref}: ${status} (tentativa ${i + 1}/${maxRetries})`);
                if (status === 'autorizado') {
                    return response.data;
                }
                if (status === 'erro_autorizacao') {
                    throw new common_1.InternalServerErrorException(`SEFAZ Rejeitou a nota: ${JSON.stringify(response.data.erros)}`);
                }
                if (status === 'denegado') {
                    throw new common_1.InternalServerErrorException(`SEFAZ Denegou a nota (Irregularidade fiscal)`);
                }
            }
            catch (error) {
                if (error instanceof common_1.InternalServerErrorException) {
                    throw error;
                }
                console.warn(`[FocusNfe] Erro de rede no polling, tentando novamente...`, error.message);
            }
        }
        throw new common_1.InternalServerErrorException(`Tempo esgotado aguardando o processamento da NF-e na Sefaz.`);
    }
    buildFocusPayload(order, company) {
        const regime = (0, cst_selector_1.parseRegimeTributario)(company.regime_tributario);
        const cstGlobal = (0, cst_selector_1.selectCst)({
            regime,
            cstOverride: company.cst_csosn_padrao || undefined,
        });
        const ufOrigem = (company.endereco_uf || 'SP').toUpperCase();
        const ufDestino = (order.customer.endereco_uf || ufOrigem).toUpperCase();
        return {
            natureza_operacao: 'VENDA DE MERCADORIA',
            data_emissao: new Date().toISOString(),
            tipo_documento: 1,
            local_destino: ufOrigem === ufDestino ? 1 : 2,
            finalidade_emissao: 1,
            consumidor_final: 1,
            presenca_comprador: 2,
            notas_referenciadas: [],
            emitente: {
                cnpj: (company.cnpj || '').replace(/\D/g, ''),
                nome: company.razao_social || 'Empresa não configurada',
                nome_fantasia: company.nome_fantasia || company.razao_social || 'Empresa não configurada',
                logradouro: company.endereco_rua || 'Rua não informada',
                numero: company.endereco_numero || 'S/N',
                bairro: company.endereco_bairro || 'Centro',
                municipio: company.endereco_cidade || 'São Paulo',
                uf: ufOrigem,
                cep: (company.endereco_cep || '01000000').replace(/\D/g, ''),
                inscricao_estadual: company.ie || 'ISENTO',
                regime_tributario: cstGlobal.crt,
            },
            destinatario: {
                nome: order.customer.name,
                cpf: order.customer.cpf_cnpj
                    ? order.customer.cpf_cnpj.replace(/\D/g, '')
                    : undefined,
                logradouro: order.customer.endereco_rua || 'Rua sem nome',
                numero: order.customer.endereco_numero || 'S/N',
                bairro: order.customer.endereco_bairro || 'Centro',
                municipio: order.customer.endereco_cidade || 'São Paulo',
                uf: ufDestino,
                cep: order.customer.endereco_cep
                    ? order.customer.endereco_cep.replace(/\D/g, '')
                    : '01000000',
                indicador_inscricao_estadual: 9,
            },
            itens: order.items.map((item, index) => {
                const cfopResult = (0, cfop_router_1.determineCfopVenda)(ufOrigem, ufDestino, !!item.product?.cst_csosn?.includes('500') || !!item.product?.cst_csosn?.includes('60'));
                const itemCst = (0, cst_selector_1.selectCst)({
                    regime,
                    cstOverride: item.product?.cst_csosn || company.cst_csosn_padrao || undefined,
                });
                return {
                    numero_item: index + 1,
                    codigo_produto: item.product?.sku || `ITEM-${item.product_id?.substring(0, 6) || index}`,
                    descricao: item.product?.name || 'Produto Diverso',
                    ncm: item.product?.ncm || '61091000',
                    cfop: item.product?.cfop || cfopResult.cfop,
                    unidade_comercial: item.product?.unidade || 'UN',
                    quantidade_comercial: item.quantidade,
                    valor_unitario_comercial: Number(item.preco_unitario),
                    valor_bruto: Number(item.subtotal),
                    unidade_tributavel: item.product?.unidade || 'UN',
                    quantidade_tributavel: item.quantidade,
                    valor_unitario_tributavel: Number(item.preco_unitario),
                    icms_origem: itemCst.icmsOrigem,
                    icms_situacao_tributaria: itemCst.icmsSituacaoTributaria,
                    pis_situacao_tributaria: itemCst.pisSituacaoTributaria,
                    cofins_situacao_tributaria: itemCst.cofinsSituacaoTributaria,
                };
            }),
            valor_frete: Number(order.frete || 0),
            valor_desconto: Number(order.desconto || 0),
            valor_total: Number(order.total),
            pagamentos: [
                {
                    forma_pagamento: '99',
                    valor_pagamento: Number(order.total),
                },
            ],
        };
    }
};
exports.FocusNfeService = FocusNfeService;
exports.FocusNfeService = FocusNfeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FocusNfeService);
//# sourceMappingURL=focus-nfe.service.js.map