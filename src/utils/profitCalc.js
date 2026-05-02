/**
 * Calculadora de Taxas Shopee 2026 — Regras de Comissão Dinâmica
 *
 * Tabela padrão baseada na documentação oficial:
 * https://seller.br.shopee.cn/edu/article/26839
 */

// Default fee tiers (Shopee Brazil 2026)
export const DEFAULT_FEE_TIERS = [
  { min: 0,     comissao: 0.25, fixa: 4.00,  pixSubsidio: 0.00 },
  { min: 12,    comissao: 0.20, fixa: 4.00,  pixSubsidio: 0.00 },
  { min: 80,    comissao: 0.14, fixa: 16.00, pixSubsidio: 0.01 },
  { min: 100,   comissao: 0.14, fixa: 16.00, pixSubsidio: 0.01 },
  { min: 150,   comissao: 0.12, fixa: 22.00, pixSubsidio: 0.01 },
  { min: 300,   comissao: 0.10, fixa: 36.00, pixSubsidio: 0.02 },
  { min: 500,   comissao: 0.08, fixa: 46.00, pixSubsidio: 0.02 },
];

/**
 * Calcula as taxas da Shopee para um preço de venda
 * @param {number} price - Preço de venda do item
 * @param {object} options - Opções de cálculo
 * @param {boolean} options.isPix - Se o pagamento é via Pix
 * @param {number} options.taxaTransacao - Taxa de transação (default 2%)
 * @param {number} options.impostoGoverno - Imposto do governo (default 6%)
 * @param {Array} options.tiers - Tabela de faixas customizada
 * @returns {object} Detalhamento das taxas
 */
export function calculateFees(price, options = {}) {
  const {
    isPix = false,
    taxaTransacao = 0.02,
    impostoGoverno = 0.06,
    tiers = DEFAULT_FEE_TIERS,
  } = options;

  if (!price || price <= 0) {
    return {
      comissao: 0,
      taxaFixa: 0,
      subsidio: 0,
      taxaTransacao: 0,
      totalTaxasShopee: 0,
      impostoGoverno: 0,
      totalTaxas: 0,
    };
  }

  // Find the applicable tier (sorted descending by min)
  let tier = tiers[0];
  const sorted = [...tiers].sort((a, b) => b.min - a.min);
  for (const t of sorted) {
    if (price >= t.min) {
      tier = t;
      break;
    }
  }

  const comissao = price * tier.comissao;
  const taxaFixa = tier.fixa;
  const subsidio = isPix ? price * tier.pixSubsidio : 0;
  const transacao = price * taxaTransacao;

  const totalTaxasShopee = comissao + taxaFixa + transacao - subsidio;
  const imposto = price * impostoGoverno;
  const totalTaxas = totalTaxasShopee + imposto;

  return {
    comissao: round(comissao),
    comissaoPercent: tier.comissao,
    taxaFixa: round(taxaFixa),
    subsidio: round(subsidio),
    taxaTransacao: round(transacao),
    totalTaxasShopee: round(totalTaxasShopee),
    impostoGoverno: round(imposto),
    totalTaxas: round(totalTaxas),
    faixa: `R$ ${tier.min}+`,
  };
}

/**
 * Calcula o lucro líquido
 * @param {number} price - Preço de venda
 * @param {number} cost - Custo do produto
 * @param {object} feeOptions - Opções de cálculo de taxa
 * @returns {object} Lucro detalhado
 */
export function calculateProfit(price, cost = 0, feeOptions = {}) {
  const fees = calculateFees(price, feeOptions);
  const lucro = price - cost - fees.totalTaxas;
  const margem = price > 0 ? (lucro / price) * 100 : 0;

  return {
    ...fees,
    custo: round(cost),
    precoVenda: round(price),
    lucroLiquido: round(lucro),
    margem: round(margem),
  };
}

/**
 * Formata valor em reais
 */
export function formatBRL(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

function round(n) {
  return Math.round(n * 100) / 100;
}
