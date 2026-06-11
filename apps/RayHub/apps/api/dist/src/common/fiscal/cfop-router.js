"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineCfop = determineCfop;
exports.determineCfopVenda = determineCfopVenda;
const CFOP_MAP = {
    venda: {
        interno: '5102',
        interestadual: '6102',
        natureza: 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS',
        descricao: 'Venda de mercadoria adquirida de terceiros',
    },
    venda_st: {
        interno: '5405',
        interestadual: '6404',
        natureza: 'VENDA DE MERCADORIA SUJEITA A ST',
        descricao: 'Venda de mercadoria com ST já retido anteriormente',
    },
    devolucao: {
        interno: '5202',
        interestadual: '6202',
        natureza: 'DEVOLUÇÃO DE COMPRA PARA COMERCIALIZAÇÃO',
        descricao: 'Devolução de compra para comercialização',
    },
    devolucao_st: {
        interno: '5411',
        interestadual: '6411',
        natureza: 'DEVOLUÇÃO DE COMPRA COM ST',
        descricao: 'Devolução de compra com substituição tributária',
    },
    remessa_marketplace: {
        interno: '5917',
        interestadual: '6917',
        natureza: 'REMESSA DE MERCADORIA EM CONSIGNAÇÃO',
        descricao: 'Remessa para marketplace (consignação mercantil)',
    },
    retorno_marketplace: {
        interno: '5919',
        interestadual: '6919',
        natureza: 'DEVOLUÇÃO DE CONSIGNAÇÃO MERCANTIL',
        descricao: 'Retorno de mercadoria em consignação',
    },
    brinde: {
        interno: '5910',
        interestadual: '6910',
        natureza: 'REMESSA EM BONIFICAÇÃO, DOAÇÃO OU BRINDE',
        descricao: 'Remessa a título de bonificação/brinde',
    },
    transferencia: {
        interno: '5152',
        interestadual: '6152',
        natureza: 'TRANSFERÊNCIA DE MERCADORIA',
        descricao: 'Transferência de mercadoria entre estabelecimentos da mesma empresa',
    },
};
function determineCfop(input) {
    const { ufOrigem, ufDestino, tipoOperacao, temSubstituicaoTributaria } = input;
    const operacaoInterna = ufOrigem.toUpperCase() === ufDestino.toUpperCase();
    let effectiveOperation = tipoOperacao;
    if (temSubstituicaoTributaria) {
        if (tipoOperacao === 'venda')
            effectiveOperation = 'venda_st';
        if (tipoOperacao === 'devolucao')
            effectiveOperation = 'devolucao_st';
    }
    const mapping = CFOP_MAP[effectiveOperation];
    if (!mapping) {
        const fallback = CFOP_MAP['venda'];
        return {
            cfop: operacaoInterna ? fallback.interno : fallback.interestadual,
            naturezaOperacao: fallback.natureza,
            operacaoInterna,
            descricao: `[FALLBACK] ${fallback.descricao}`,
        };
    }
    return {
        cfop: operacaoInterna ? mapping.interno : mapping.interestadual,
        naturezaOperacao: mapping.natureza,
        operacaoInterna,
        descricao: mapping.descricao,
    };
}
function determineCfopVenda(ufOrigem, ufDestino, temST = false) {
    return determineCfop({
        ufOrigem,
        ufDestino,
        tipoOperacao: 'venda',
        temSubstituicaoTributaria: temST,
    });
}
//# sourceMappingURL=cfop-router.js.map