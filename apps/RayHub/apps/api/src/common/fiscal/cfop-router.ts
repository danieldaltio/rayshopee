/**
 * Roteador Automático de CFOP (Código Fiscal de Operações e Prestações)
 * 
 * Conforme Convênio SINIEF s/nº de 1970 e ajustes posteriores.
 * Determina o CFOP correto baseado em UF de origem/destino e tipo de operação.
 * 
 * Regra fundamental:
 * - 5xxx = Operação interna (mesma UF)
 * - 6xxx = Operação interestadual (UFs diferentes)
 * - 7xxx = Exportação (não implementado nesta versão)
 */

export type OperationType = 
  | 'venda'                    // Venda de mercadoria
  | 'venda_st'                 // Venda com Substituição Tributária
  | 'devolucao'                // Devolução de compra
  | 'devolucao_st'             // Devolução com ST
  | 'remessa_marketplace'      // Remessa para marketplace (consignação)
  | 'retorno_marketplace'      // Retorno de marketplace
  | 'brinde'                   // Remessa de brinde/bonificação
  | 'transferencia';           // Transferência entre estabelecimentos

interface CfopInput {
  /** UF do emitente (ex: "SP", "RJ", "MG") */
  ufOrigem: string;
  /** UF do destinatário (ex: "SP", "RJ", "MG") */
  ufDestino: string;
  /** Tipo de operação fiscal */
  tipoOperacao: OperationType;
  /** Se o produto possui Substituição Tributária na UF de destino */
  temSubstituicaoTributaria?: boolean;
}

interface CfopResult {
  /** CFOP determinado (ex: "5102", "6102") */
  cfop: string;
  /** Natureza da operação para a NF-e */
  naturezaOperacao: string;
  /** Se é operação interna (true) ou interestadual (false) */
  operacaoInterna: boolean;
  /** Descrição resumida do CFOP */
  descricao: string;
}

/**
 * Mapeamento de CFOPs por tipo de operação.
 * Primeiro valor = operação interna (5xxx), segundo = interestadual (6xxx)
 */
const CFOP_MAP: Record<OperationType, { interno: string; interestadual: string; natureza: string; descricao: string }> = {
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

/**
 * Determina o CFOP correto para uma operação fiscal.
 * 
 * @example
 * // Venda de SP para SP
 * determineCfop({ ufOrigem: 'SP', ufDestino: 'SP', tipoOperacao: 'venda' })
 * // => { cfop: '5102', naturezaOperacao: 'VENDA DE MERCADORIA...', operacaoInterna: true }
 * 
 * @example
 * // Venda de SP para MG
 * determineCfop({ ufOrigem: 'SP', ufDestino: 'MG', tipoOperacao: 'venda' })
 * // => { cfop: '6102', naturezaOperacao: 'VENDA DE MERCADORIA...', operacaoInterna: false }
 * 
 * @example
 * // Venda com ST de SP para RJ
 * determineCfop({ ufOrigem: 'SP', ufDestino: 'RJ', tipoOperacao: 'venda', temSubstituicaoTributaria: true })
 * // => { cfop: '6404', ... }
 */
export function determineCfop(input: CfopInput): CfopResult {
  const { ufOrigem, ufDestino, tipoOperacao, temSubstituicaoTributaria } = input;

  // Determina se é operação interna ou interestadual
  const operacaoInterna = ufOrigem.toUpperCase() === ufDestino.toUpperCase();

  // Se tem ST e a operação é venda, usa o CFOP de ST
  let effectiveOperation = tipoOperacao;
  if (temSubstituicaoTributaria) {
    if (tipoOperacao === 'venda') effectiveOperation = 'venda_st';
    if (tipoOperacao === 'devolucao') effectiveOperation = 'devolucao_st';
  }

  const mapping = CFOP_MAP[effectiveOperation];
  if (!mapping) {
    // Fallback seguro para venda simples
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

/**
 * Determina o CFOP para uma venda padrão de e-commerce (caso mais comum).
 * Atalho para `determineCfop` com tipoOperacao = 'venda'.
 */
export function determineCfopVenda(ufOrigem: string, ufDestino: string, temST = false): CfopResult {
  return determineCfop({
    ufOrigem,
    ufDestino,
    tipoOperacao: 'venda',
    temSubstituicaoTributaria: temST,
  });
}
