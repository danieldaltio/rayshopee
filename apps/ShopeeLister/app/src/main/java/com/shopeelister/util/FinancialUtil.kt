package com.shopeelister.util

// Taxa de transação (2%)
const val TAXA_TRANSACAO = 0.02
// Imposto do governo (6%)
const val IMPOSTO_GOVERNO = 0.06

// Tabela de comissão Shopee por faixa de preço
data class FeeTier(val minPrice: Double, val commission: Double, val fixedFee: Double, val pixSubsidy: Double)

val FEE_TIERS = listOf(
    FeeTier(0.0, 0.25, 4.00, 0.00),      // R$ 0-12: 25% + R$4
    FeeTier(12.0, 0.20, 4.00, 0.00),     // R$ 12-80: 20% + R$4
    FeeTier(80.0, 0.14, 16.00, 0.01),   // R$ 80-100: 14% + R$16 + 1% pix
    FeeTier(100.0, 0.14, 16.00, 0.01),  // R$ 100-150: 14% + R$16 + 1% pix
    FeeTier(150.0, 0.12, 22.00, 0.01),  // R$ 150-300: 12% + R$22 + 1% pix
    FeeTier(300.0, 0.10, 36.00, 0.02), // R$ 300-500: 10% + R$36 + 2% pix
    FeeTier(500.0, 0.08, 46.00, 0.02), // R$ 500+: 8% + R$46 + 2% pix
)

object FinancialUtil {
    fun calculateProfit(price: Double, cost: Double): Pair<Double, Double> {
        if (price <= 0 || cost <= 0) return Pair(0.0, 0.0)
        
        // Find applicable tier
        var tier = FEE_TIERS[0]
        for (t in FEE_TIERS.reversed()) {
            if (price >= t.minPrice) {
                tier = t
                break
            }
        }
        
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
}
