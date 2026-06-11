"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICMS_ALIQUOTA_INTERNA = void 0;
exports.getAliquotaInterestadual = getAliquotaInterestadual;
exports.calculateTaxes = calculateTaxes;
exports.ICMS_ALIQUOTA_INTERNA = {
    AC: 19.00, AL: 19.00, AP: 18.00, AM: 20.00,
    BA: 20.50, CE: 20.00, DF: 20.00, ES: 17.00,
    GO: 19.00, MA: 22.00, MT: 17.00, MS: 17.00,
    MG: 18.00, PA: 19.00, PB: 20.00, PR: 19.50,
    PE: 20.50, PI: 21.00, RJ: 22.00, RN: 20.00,
    RS: 17.00, RO: 19.50, RR: 20.00, SC: 17.00,
    SP: 18.00, SE: 19.00, TO: 20.00,
};
const UFS_NORTE_NORDESTE_CO_ES = new Set([
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO',
    'RR', 'SE', 'TO',
]);
function getAliquotaInterestadual(ufOrigem, ufDestino, produtoImportado = false) {
    if (produtoImportado)
        return 4.00;
    const destino = ufDestino.toUpperCase();
    if (UFS_NORTE_NORDESTE_CO_ES.has(destino))
        return 7.00;
    return 12.00;
}
function calculateTaxes(input) {
    const { valorProdutos, valorFrete, valorDesconto, ufOrigem, ufDestino, regime, aliquotaSimples = 6.0, produtoImportado = false, destinatarioContribuinte = false, } = input;
    const baseCalculo = valorProdutos + valorFrete - valorDesconto;
    const operacaoInterna = ufOrigem.toUpperCase() === ufDestino.toUpperCase();
    let icmsAliquota;
    let icmsValor;
    if (regime === 'simples_nacional') {
        icmsAliquota = aliquotaSimples;
        icmsValor = baseCalculo * (aliquotaSimples / 100);
    }
    else if (operacaoInterna) {
        icmsAliquota = exports.ICMS_ALIQUOTA_INTERNA[ufOrigem.toUpperCase()] || 18.0;
        icmsValor = baseCalculo * (icmsAliquota / 100);
    }
    else {
        icmsAliquota = getAliquotaInterestadual(ufOrigem, ufDestino, produtoImportado);
        icmsValor = baseCalculo * (icmsAliquota / 100);
    }
    let difal = {
        aplicavel: false,
        aliquotaInterna: 0,
        aliquotaInterestadual: 0,
        valorDifal: 0,
        fundoPobreza: 0,
    };
    if (!operacaoInterna && !destinatarioContribuinte && regime !== 'simples_nacional') {
        const aliqInterna = exports.ICMS_ALIQUOTA_INTERNA[ufDestino.toUpperCase()] || 18.0;
        const aliqInter = getAliquotaInterestadual(ufOrigem, ufDestino, produtoImportado);
        if (aliqInterna > aliqInter) {
            const difalPercent = aliqInterna - aliqInter;
            difal = {
                aplicavel: true,
                aliquotaInterna: aliqInterna,
                aliquotaInterestadual: aliqInter,
                valorDifal: baseCalculo * (difalPercent / 100),
                fundoPobreza: 0,
            };
        }
    }
    let pisAliquota;
    let cofinsAliquota;
    if (regime === 'simples_nacional') {
        pisAliquota = 0;
        cofinsAliquota = 0;
    }
    else if (regime === 'lucro_presumido') {
        pisAliquota = 0.65;
        cofinsAliquota = 3.00;
    }
    else {
        pisAliquota = 1.65;
        cofinsAliquota = 7.60;
    }
    const pisValor = baseCalculo * (pisAliquota / 100);
    const cofinsValor = baseCalculo * (cofinsAliquota / 100);
    const totalImpostos = icmsValor + difal.valorDifal + difal.fundoPobreza + pisValor + cofinsValor;
    const cargaTributariaPercent = baseCalculo > 0 ? (totalImpostos / baseCalculo) * 100 : 0;
    return {
        baseCalculo: round(baseCalculo),
        icms: {
            aliquota: round(icmsAliquota),
            valor: round(icmsValor),
        },
        difal: {
            ...difal,
            valorDifal: round(difal.valorDifal),
            fundoPobreza: round(difal.fundoPobreza),
        },
        pis: {
            aliquota: round(pisAliquota),
            valor: round(pisValor),
        },
        cofins: {
            aliquota: round(cofinsAliquota),
            valor: round(cofinsValor),
        },
        totalImpostos: round(totalImpostos),
        cargaTributariaPercent: round(cargaTributariaPercent),
    };
}
function round(value) {
    return Math.round(value * 100) / 100;
}
//# sourceMappingURL=tax-calculator.js.map