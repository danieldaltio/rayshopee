/**
 * Calculadora de Impostos Básica para E-commerce
 * 
 * Calcula ICMS, DIFAL (LC 190/2022), PIS e COFINS para operações de venda.
 * 
 * IMPORTANTE: Este módulo cobre os cenários mais comuns de e-commerce.
 * Para operações com ICMS-ST, IPI, ou regimes especiais, deve-se
 * consultar um contador ou usar o motor tributário completo (fase futura).
 * 
 * Base legal:
 * - ICMS: LC 87/96 (Lei Kandir)
 * - DIFAL: EC 87/2015 regulamentada pela LC 190/2022
 * - PIS: Lei 10.637/2002 (não cumulativo) / Lei 9.718/1998 (cumulativo)
 * - COFINS: Lei 10.833/2003 (não cumulativo) / Lei 9.718/1998 (cumulativo)
 */

import { type RegimeTributario } from './cst-selector';

/**
 * Tabela de alíquotas internas de ICMS por UF (valores mais comuns — 2024/2025).
 * Fonte: Legislação estadual de cada UF.
 * 
 * NOTA: Algumas UFs têm alíquotas diferenciadas por produto (alimentos, medicamentos, etc).
 * Esta tabela usa a alíquota padrão (modal).
 */
export const ICMS_ALIQUOTA_INTERNA: Record<string, number> = {
  AC: 19.00, AL: 19.00, AP: 18.00, AM: 20.00,
  BA: 20.50, CE: 20.00, DF: 20.00, ES: 17.00,
  GO: 19.00, MA: 22.00, MT: 17.00, MS: 17.00,
  MG: 18.00, PA: 19.00, PB: 20.00, PR: 19.50,
  PE: 20.50, PI: 21.00, RJ: 22.00, RN: 20.00,
  RS: 17.00, RO: 19.50, RR: 20.00, SC: 17.00,
  SP: 18.00, SE: 19.00, TO: 20.00,
};

/**
 * Alíquota interestadual de ICMS.
 * Art. 155, §2º, IV da CF/88.
 * 
 * - 7% para destino N/NE/CO + ES
 * - 12% para destino S/SE (exceto ES)
 * - 4% para produtos importados (Resolução do Senado nº 13/2012)
 */
const UFS_NORTE_NORDESTE_CO_ES = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO',
  'RR', 'SE', 'TO',
]);

export function getAliquotaInterestadual(ufOrigem: string, ufDestino: string, produtoImportado = false): number {
  if (produtoImportado) return 4.00; // Resolução do Senado nº 13/2012

  const destino = ufDestino.toUpperCase();
  if (UFS_NORTE_NORDESTE_CO_ES.has(destino)) return 7.00;
  return 12.00;
}

// ─── Interfaces ────────────────────────────────────────────────

export interface TaxCalculationInput {
  /** Valor total dos produtos (sem frete) */
  valorProdutos: number;
  /** Valor do frete */
  valorFrete: number;
  /** Valor do desconto */
  valorDesconto: number;
  /** UF do emitente */
  ufOrigem: string;
  /** UF do destinatário */
  ufDestino: string;
  /** Regime tributário da empresa */
  regime: RegimeTributario;
  /** Alíquota efetiva do Simples Nacional (% do DAS) */
  aliquotaSimples?: number;
  /** Se o produto é importado */
  produtoImportado?: boolean;
  /** Se o destinatário é contribuinte do ICMS */
  destinatarioContribuinte?: boolean;
}

export interface TaxCalculationResult {
  /** Base de cálculo dos impostos */
  baseCalculo: number;
  /** Valor do ICMS */
  icms: {
    aliquota: number;
    valor: number;
  };
  /** DIFAL — apenas para operações interestaduais para consumidor final */
  difal: {
    aplicavel: boolean;
    aliquotaInterna: number;
    aliquotaInterestadual: number;
    valorDifal: number;
    /** Fundo de Combate à Pobreza (2% adicional em alguns estados) */
    fundoPobreza: number;
  };
  /** PIS */
  pis: {
    aliquota: number;
    valor: number;
  };
  /** COFINS */
  cofins: {
    aliquota: number;
    valor: number;
  };
  /** Carga tributária total estimada */
  totalImpostos: number;
  /** Percentual da carga sobre o valor total */
  cargaTributariaPercent: number;
}

/**
 * Calcula os impostos de uma operação de venda.
 * 
 * @example
 * calculateTaxes({
 *   valorProdutos: 100,
 *   valorFrete: 15,
 *   valorDesconto: 0,
 *   ufOrigem: 'SP',
 *   ufDestino: 'MG',
 *   regime: 'simples_nacional',
 *   aliquotaSimples: 6.0,
 * })
 */
export function calculateTaxes(input: TaxCalculationInput): TaxCalculationResult {
  const {
    valorProdutos,
    valorFrete,
    valorDesconto,
    ufOrigem,
    ufDestino,
    regime,
    aliquotaSimples = 6.0,
    produtoImportado = false,
    destinatarioContribuinte = false,
  } = input;

  const baseCalculo = valorProdutos + valorFrete - valorDesconto;
  const operacaoInterna = ufOrigem.toUpperCase() === ufDestino.toUpperCase();

  // ─── ICMS ──────────────────────────────────────────────────
  let icmsAliquota: number;
  let icmsValor: number;

  if (regime === 'simples_nacional') {
    // No Simples, o ICMS está embutido no DAS
    // A alíquota efetiva do Simples Nacional inclui ICMS
    icmsAliquota = aliquotaSimples;
    icmsValor = baseCalculo * (aliquotaSimples / 100);
  } else if (operacaoInterna) {
    icmsAliquota = ICMS_ALIQUOTA_INTERNA[ufOrigem.toUpperCase()] || 18.0;
    icmsValor = baseCalculo * (icmsAliquota / 100);
  } else {
    icmsAliquota = getAliquotaInterestadual(ufOrigem, ufDestino, produtoImportado);
    icmsValor = baseCalculo * (icmsAliquota / 100);
  }

  // ─── DIFAL (EC 87/2015 + LC 190/2022) ─────────────────────
  // Aplica-se em operações interestaduais para consumidor final não contribuinte
  let difal = {
    aplicavel: false,
    aliquotaInterna: 0,
    aliquotaInterestadual: 0,
    valorDifal: 0,
    fundoPobreza: 0,
  };

  if (!operacaoInterna && !destinatarioContribuinte && regime !== 'simples_nacional') {
    // DIFAL = (alíquota interna UF destino - alíquota interestadual) × base de cálculo
    const aliqInterna = ICMS_ALIQUOTA_INTERNA[ufDestino.toUpperCase()] || 18.0;
    const aliqInter = getAliquotaInterestadual(ufOrigem, ufDestino, produtoImportado);

    if (aliqInterna > aliqInter) {
      const difalPercent = aliqInterna - aliqInter;
      difal = {
        aplicavel: true,
        aliquotaInterna: aliqInterna,
        aliquotaInterestadual: aliqInter,
        valorDifal: baseCalculo * (difalPercent / 100),
        fundoPobreza: 0, // TODO: Implementar fundo de pobreza por UF (2% adicional em RJ, MG, etc)
      };
    }
  }

  // ─── PIS e COFINS ──────────────────────────────────────────
  let pisAliquota: number;
  let cofinsAliquota: number;

  if (regime === 'simples_nacional') {
    // PIS/COFINS embutidos no DAS — não destaca separadamente na NF-e
    pisAliquota = 0;
    cofinsAliquota = 0;
  } else if (regime === 'lucro_presumido') {
    // Regime cumulativo
    pisAliquota = 0.65;
    cofinsAliquota = 3.00;
  } else {
    // Lucro Real — regime não cumulativo
    pisAliquota = 1.65;
    cofinsAliquota = 7.60;
  }

  const pisValor = baseCalculo * (pisAliquota / 100);
  const cofinsValor = baseCalculo * (cofinsAliquota / 100);

  // ─── Total ─────────────────────────────────────────────────
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

/** Arredonda para 2 casas decimais */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
