import { type RegimeTributario } from './cst-selector';
export declare const ICMS_ALIQUOTA_INTERNA: Record<string, number>;
export declare function getAliquotaInterestadual(ufOrigem: string, ufDestino: string, produtoImportado?: boolean): number;
export interface TaxCalculationInput {
    valorProdutos: number;
    valorFrete: number;
    valorDesconto: number;
    ufOrigem: string;
    ufDestino: string;
    regime: RegimeTributario;
    aliquotaSimples?: number;
    produtoImportado?: boolean;
    destinatarioContribuinte?: boolean;
}
export interface TaxCalculationResult {
    baseCalculo: number;
    icms: {
        aliquota: number;
        valor: number;
    };
    difal: {
        aplicavel: boolean;
        aliquotaInterna: number;
        aliquotaInterestadual: number;
        valorDifal: number;
        fundoPobreza: number;
    };
    pis: {
        aliquota: number;
        valor: number;
    };
    cofins: {
        aliquota: number;
        valor: number;
    };
    totalImpostos: number;
    cargaTributariaPercent: number;
}
export declare function calculateTaxes(input: TaxCalculationInput): TaxCalculationResult;
