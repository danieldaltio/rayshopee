"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectCst = selectCst;
exports.parseRegimeTributario = parseRegimeTributario;
function selectCst(input) {
    const { regime, origemProduto = 0, temSubstituicaoTributaria = false, isento = false, cstOverride, } = input;
    if (cstOverride) {
        return {
            crt: regimeToCrt(regime),
            icmsOrigem: origemProduto,
            icmsSituacaoTributaria: cstOverride,
            pisSituacaoTributaria: selectPisCofins(regime),
            cofinsSituacaoTributaria: selectPisCofins(regime),
            descricao: `CST/CSOSN manual: ${cstOverride}`,
        };
    }
    if (regime === 'simples_nacional') {
        return selectCsosn(origemProduto, temSubstituicaoTributaria, isento);
    }
    return selectCstLucro(regime, origemProduto, temSubstituicaoTributaria, isento);
}
function selectCsosn(origemProduto, temST, isento) {
    let csosn;
    let descricao;
    if (isento) {
        csosn = '400';
        descricao = 'CSOSN 400 — Não tributada pelo Simples Nacional';
    }
    else if (temST) {
        csosn = '500';
        descricao = 'CSOSN 500 — ICMS cobrado anteriormente por ST';
    }
    else {
        csosn = '102';
        descricao = 'CSOSN 102 — Tributada sem permissão de crédito (Simples Nacional)';
    }
    return {
        crt: 1,
        icmsOrigem: origemProduto,
        icmsSituacaoTributaria: csosn,
        pisSituacaoTributaria: '07',
        cofinsSituacaoTributaria: '07',
        descricao,
    };
}
function selectCstLucro(regime, origemProduto, temST, isento) {
    const crt = regime === 'lucro_real' ? 3 : 3;
    let cst;
    let descricao;
    if (isento) {
        cst = '40';
        descricao = 'CST 40 — Isenta';
    }
    else if (temST) {
        cst = '60';
        descricao = 'CST 60 — ICMS cobrado anteriormente por Substituição Tributária';
    }
    else {
        cst = '00';
        descricao = 'CST 00 — Tributada integralmente';
    }
    const pisCofins = regime === 'lucro_presumido' ? '01' : '01';
    return {
        crt,
        icmsOrigem: origemProduto,
        icmsSituacaoTributaria: cst,
        pisSituacaoTributaria: pisCofins,
        cofinsSituacaoTributaria: pisCofins,
        descricao,
    };
}
function regimeToCrt(regime) {
    switch (regime) {
        case 'simples_nacional': return 1;
        case 'lucro_presumido': return 3;
        case 'lucro_real': return 3;
        default: return 1;
    }
}
function selectPisCofins(regime) {
    return regime === 'simples_nacional' ? '07' : '01';
}
function parseRegimeTributario(value) {
    if (!value)
        return 'simples_nacional';
    const normalized = value.toLowerCase().trim().replace(/[^a-z]/g, '');
    if (normalized.includes('real'))
        return 'lucro_real';
    if (normalized.includes('presumido'))
        return 'lucro_presumido';
    if (normalized.includes('simples') || normalized.includes('nacional'))
        return 'simples_nacional';
    return 'simples_nacional';
}
//# sourceMappingURL=cst-selector.js.map