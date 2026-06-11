/**
 * Seletor Automático de CST (Código de Situação Tributária) e 
 * CSOSN (Código de Situação da Operação do Simples Nacional)
 * 
 * Simples Nacional → CSOSN (Anexo I, Convênio SINIEF 06/89)
 * Lucro Real/Presumido → CST (Tabela A + Tabela B, RICMS)
 * 
 * Também seleciona a situação tributária de PIS e COFINS.
 */

export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';

/** Código de regime tributário para a NF-e (campo CRT) */
export type CodigoRegimeTributario = 1 | 2 | 3;

export type OrigemProduto =
  | 0  // Nacional
  | 1  // Estrangeira (importação direta)
  | 2  // Estrangeira (adquirida no mercado interno)
  | 3  // Nacional com conteúdo de importação superior a 40%
  | 4  // Nacional com produção conforme processos básicos
  | 5  // Nacional com conteúdo de importação inferior ou igual a 40%
  | 6  // Estrangeira (importação direta sem similar nacional)
  | 7  // Estrangeira (adquirida no mercado interno, sem similar nacional)
  | 8; // Nacional com conteúdo de importação superior a 70%

interface CstInput {
  /** Regime tributário da empresa */
  regime: RegimeTributario;
  /** Origem do produto (0 = Nacional, 1-8 = variações de importação) */
  origemProduto?: OrigemProduto;
  /** Se o produto tem substituição tributária */
  temSubstituicaoTributaria?: boolean;
  /** Se o produto é isento/imune de ICMS */
  isento?: boolean;
  /** CST/CSOSN configurado manualmente no produto (override) */
  cstOverride?: string;
}

export interface CstResult {
  /** Código de Regime Tributário (CRT) para o campo da NF-e */
  crt: CodigoRegimeTributario;
  /** Origem do produto (0-8) — compõe o primeiro dígito da CST */
  icmsOrigem: OrigemProduto;
  /** CST ou CSOSN do ICMS (string de 2-3 dígitos) */
  icmsSituacaoTributaria: string;
  /** Situação tributária do PIS */
  pisSituacaoTributaria: string;
  /** Situação tributária do COFINS */
  cofinsSituacaoTributaria: string;
  /** Descrição legível do código selecionado */
  descricao: string;
}

/**
 * Seleciona automaticamente os códigos CST/CSOSN e PIS/COFINS
 * com base no regime tributário da empresa e características do produto.
 * 
 * @example
 * // Empresa do Simples Nacional, produto nacional
 * selectCst({ regime: 'simples_nacional' })
 * // => { crt: 1, icmsSituacaoTributaria: '102', pisSituacaoTributaria: '07', ... }
 * 
 * @example
 * // Empresa do Lucro Presumido, produto nacional
 * selectCst({ regime: 'lucro_presumido' })
 * // => { crt: 3, icmsSituacaoTributaria: '00', pisSituacaoTributaria: '01', ... }
 */
export function selectCst(input: CstInput): CstResult {
  const {
    regime,
    origemProduto = 0,
    temSubstituicaoTributaria = false,
    isento = false,
    cstOverride,
  } = input;

  // Se há override manual, respeita
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

/**
 * Seleciona CSOSN para empresas do Simples Nacional.
 * 
 * Códigos principais:
 * - 101: Tributada com permissão de crédito (usado quando o destinatário contribuinte pode creditarse)
 * - 102: Tributada sem permissão de crédito (caso mais comum para venda ao consumidor final)
 * - 103: Isenção de ICMS para faixa de receita bruta
 * - 300: Imune
 * - 400: Não tributada
 * - 500: ICMS cobrado anteriormente por ST ou antecipação
 * - 900: Outros (usado para operações mistas)
 */
function selectCsosn(
  origemProduto: OrigemProduto,
  temST: boolean,
  isento: boolean,
): CstResult {
  let csosn: string;
  let descricao: string;

  if (isento) {
    csosn = '400';
    descricao = 'CSOSN 400 — Não tributada pelo Simples Nacional';
  } else if (temST) {
    csosn = '500';
    descricao = 'CSOSN 500 — ICMS cobrado anteriormente por ST';
  } else {
    // Caso padrão para e-commerce B2C (venda ao consumidor final)
    csosn = '102';
    descricao = 'CSOSN 102 — Tributada sem permissão de crédito (Simples Nacional)';
  }

  return {
    crt: 1, // 1 = Simples Nacional
    icmsOrigem: origemProduto,
    icmsSituacaoTributaria: csosn,
    pisSituacaoTributaria: '07', // 07 = Operação Isenta da Contribuição (Simples)
    cofinsSituacaoTributaria: '07',
    descricao,
  };
}

/**
 * Seleciona CST para empresas do Lucro Real ou Presumido.
 * 
 * CST ICMS principais:
 * - 00: Tributada integralmente
 * - 10: Tributada com cobrança do ICMS por ST
 * - 20: Com redução de base de cálculo
 * - 30: Isenta/não tributada com cobrança do ICMS por ST
 * - 40: Isenta
 * - 41: Não tributada
 * - 50: Suspensão
 * - 60: ICMS cobrado anteriormente por ST
 * - 70: Com redução de BC e cobrança do ICMS por ST
 * - 90: Outros
 */
function selectCstLucro(
  regime: RegimeTributario,
  origemProduto: OrigemProduto,
  temST: boolean,
  isento: boolean,
): CstResult {
  const crt: CodigoRegimeTributario = regime === 'lucro_real' ? 3 : 3; // CRT 3 = Regime Normal (LP e LR)

  let cst: string;
  let descricao: string;

  if (isento) {
    cst = '40';
    descricao = 'CST 40 — Isenta';
  } else if (temST) {
    cst = '60';
    descricao = 'CST 60 — ICMS cobrado anteriormente por Substituição Tributária';
  } else {
    cst = '00';
    descricao = 'CST 00 — Tributada integralmente';
  }

  // PIS/COFINS para Lucro Presumido = regime cumulativo (CST 01)
  // PIS/COFINS para Lucro Real = regime não cumulativo (CST 01 também, mas com direito a crédito)
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

/** Mapeia o regime tributário para o código CRT da NF-e */
function regimeToCrt(regime: RegimeTributario): CodigoRegimeTributario {
  switch (regime) {
    case 'simples_nacional': return 1;
    case 'lucro_presumido': return 3;
    case 'lucro_real': return 3;
    default: return 1;
  }
}

/** Seleciona PIS/COFINS baseado no regime */
function selectPisCofins(regime: RegimeTributario): string {
  // Simples Nacional: CST 07 (isento da contribuição)
  // Lucro Presumido/Real: CST 01 (operação tributável com alíquota básica)
  return regime === 'simples_nacional' ? '07' : '01';
}

/**
 * Converte a string de regime tributário do banco para o tipo RegimeTributario.
 * Aceita variações comuns e faz normalização.
 */
export function parseRegimeTributario(value?: string | null): RegimeTributario {
  if (!value) return 'simples_nacional'; // Default seguro para e-commerce

  const normalized = value.toLowerCase().trim().replace(/[^a-z]/g, '');

  if (normalized.includes('real')) return 'lucro_real';
  if (normalized.includes('presumido')) return 'lucro_presumido';
  if (normalized.includes('simples') || normalized.includes('nacional')) return 'simples_nacional';

  return 'simples_nacional';
}
