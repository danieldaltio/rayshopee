export type OperationType = 'venda' | 'venda_st' | 'devolucao' | 'devolucao_st' | 'remessa_marketplace' | 'retorno_marketplace' | 'brinde' | 'transferencia';
interface CfopInput {
    ufOrigem: string;
    ufDestino: string;
    tipoOperacao: OperationType;
    temSubstituicaoTributaria?: boolean;
}
interface CfopResult {
    cfop: string;
    naturezaOperacao: string;
    operacaoInterna: boolean;
    descricao: string;
}
export declare function determineCfop(input: CfopInput): CfopResult;
export declare function determineCfopVenda(ufOrigem: string, ufDestino: string, temST?: boolean): CfopResult;
export {};
