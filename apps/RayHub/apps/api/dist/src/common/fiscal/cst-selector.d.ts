export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
export type CodigoRegimeTributario = 1 | 2 | 3;
export type OrigemProduto = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
interface CstInput {
    regime: RegimeTributario;
    origemProduto?: OrigemProduto;
    temSubstituicaoTributaria?: boolean;
    isento?: boolean;
    cstOverride?: string;
}
export interface CstResult {
    crt: CodigoRegimeTributario;
    icmsOrigem: OrigemProduto;
    icmsSituacaoTributaria: string;
    pisSituacaoTributaria: string;
    cofinsSituacaoTributaria: string;
    descricao: string;
}
export declare function selectCst(input: CstInput): CstResult;
export declare function parseRegimeTributario(value?: string | null): RegimeTributario;
export {};
