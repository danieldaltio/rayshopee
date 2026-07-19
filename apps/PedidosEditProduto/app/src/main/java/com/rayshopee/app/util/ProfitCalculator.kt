package com.rayshopee.app.util

/**
 * Calculadora de margem de lucro para produtos vendidos na Shopee Brasil.
 *
 * Extraída de `archive/dead-code-2026-07-01/ui/screens/ScannerScreen.kt` (versão antiga)
 * e disponibilizada como utility reutilizável. Hoje nenhum código vivo a consome, mas:
 * - É testada em `app/src/test/java/com/rayshopee/app/util/ProfitCalculatorTest.kt`
 * - Está pronta para ser usada pelo `OrdersScreen` quando ele quiser mostrar margem
 *
 * Fórmula:
 * ```
 * Lucro = Preço - Custo - (Comissão + Fixo + Transação - SubsídioPIX) - Imposto
 * Margem = (Lucro / Preço) * 100
 * ```
 */

// Impostos e taxas fixas
const val TAXA_TRANSACAO = 0.02      // 2% taxa de transação
const val IMPOSTO_GOVERNO = 0.06      // 6% imposto governo

/**
 * Tabela de comissões Shopee por faixa de preço mínimo.
 * Replicada da documentação oficial de taxas Shopee Brasil.
 */
data class FeeTier(
    val minPrice: Double,
    val commission: Double,  // % sobre o preço
    val fixedFee: Double,    // taxa fixa em R$
    val pixSubsidy: Double   // % subsídio PIX
)

val FEE_TIERS: List<FeeTier> = listOf(
    FeeTier(minPrice = 0.0,   commission = 0.25, fixedFee = 4.00, pixSubsidy = 0.00),
    FeeTier(minPrice = 12.0,  commission = 0.20, fixedFee = 4.00, pixSubsidy = 0.00),
    FeeTier(minPrice = 80.0,  commission = 0.14, fixedFee = 16.00, pixSubsidy = 0.01),
    FeeTier(minPrice = 100.0, commission = 0.14, fixedFee = 16.00, pixSubsidy = 0.01),
    FeeTier(minPrice = 150.0, commission = 0.12, fixedFee = 22.00, pixSubsidy = 0.01),
    FeeTier(minPrice = 300.0, commission = 0.10, fixedFee = 36.00, pixSubsidy = 0.02),
    FeeTier(minPrice = 500.0, commission = 0.08, fixedFee = 46.00, pixSubsidy = 0.02),
)

/**
 * Encontra a faixa de taxa aplicável ao preço informado.
 * Retorna a maior faixa cujo minPrice <= price.
 */
fun findTier(price: Double): FeeTier {
    if (price < 0) return FEE_TIERS[0]
    var tier = FEE_TIERS[0]
    for (t in FEE_TIERS) {
        if (price >= t.minPrice) tier = t
    }
    return tier
}

/**
 * Calcula lucro previsto e margem para um produto Shopee.
 *
 * @param price preço de venda (R$)
 * @param cost custo do produto (R$)
 * @return Pair(lucro em R$, margem em %)
 *         Retorna (0.0, 0.0) se price <= 0 ou cost <= 0
 */
fun calculateProfit(price: Double, cost: Double): Pair<Double, Double> {
    if (price <= 0 || cost <= 0) return Pair(0.0, 0.0)

    val tier = findTier(price)
    val commission = price * tier.commission
    val fixedFee = tier.fixedFee
    val pixSubsidy = price * tier.pixSubsidy
    val transacao = price * TAXA_TRANSACAO
    val taxaShopee = commission + fixedFee + transacao - pixSubsidy
    val imposto = price * IMPOSTO_GOVERNO
    val totalTaxas = taxaShopee + imposto

    val profit = price - cost - totalTaxas
    val margin = if (price > 0) (profit / price) * 100 else 0.0

    return Pair(profit, margin)
}

/**
 * Calcula o detalhamento de taxas para um preço (útil pra UI mostrar breakdown).
 */
data class FeeBreakdown(
    val tier: FeeTier,
    val commission: Double,
    val fixedFee: Double,
    val transaction: Double,
    val pixSubsidy: Double,
    val governmentTax: Double,
    val totalFees: Double
)

fun breakdownFees(price: Double): FeeBreakdown {
    val tier = findTier(price)
    val commission = price * tier.commission
    val pixSubsidy = price * tier.pixSubsidy
    val transaction = price * TAXA_TRANSACAO
    val governmentTax = price * IMPOSTO_GOVERNO
    val totalFees = commission + tier.fixedFee + transaction - pixSubsidy + governmentTax
    return FeeBreakdown(tier, commission, tier.fixedFee, transaction, pixSubsidy, governmentTax, totalFees)
}