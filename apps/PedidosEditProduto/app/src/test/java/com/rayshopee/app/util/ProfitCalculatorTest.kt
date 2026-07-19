package com.rayshopee.app.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Testes da fórmula financeira de cálculo de lucro Shopee.
 *
 * Cobre:
 * - Cada boundary de tier (R$0-12, R$12-80, R$80-100, R$100-150, R$150-300, R$300-500, R$500+)
 * - Casos extremos (preço/custo zero ou negativo)
 * - Breakdown de taxas
 */
class ProfitCalculatorTest {

    // Helper de tolerância para comparação de doubles
    private val EPSILON = 0.01

    @Test
    fun `tier 0 a 12 reais aplica 25 por cento mais R$4 fixo`() {
        // Preço R$10, custo R$5
        // commission = 10 * 0.25 = 2.50
        // fixedFee = 4.00
        // transacao = 10 * 0.02 = 0.20
        // pixSubsidy = 0
        // taxaShopee = 2.50 + 4.00 + 0.20 - 0 = 6.70
        // imposto = 10 * 0.06 = 0.60
        // totalTaxas = 7.30
        // lucro = 10 - 5 - 7.30 = -2.30 (prejuízo)
        val (profit, margin) = calculateProfit(price = 10.0, cost = 5.0)
        assertEquals(-2.30, profit, EPSILON)
        assertEquals(-23.00, margin, EPSILON)
    }

    @Test
    fun `tier 12 a 80 reais aplica 20 por cento mais R$4 fixo`() {
        // Preço R$50, custo R$20
        // commission = 50 * 0.20 = 10.00
        // fixedFee = 4.00
        // transacao = 50 * 0.02 = 1.00
        // taxaShopee = 10 + 4 + 1 - 0 = 15.00
        // imposto = 50 * 0.06 = 3.00
        // totalTaxas = 18.00
        // lucro = 50 - 20 - 18 = 12.00
        // margem = 12/50 * 100 = 24.00%
        val (profit, margin) = calculateProfit(price = 50.0, cost = 20.0)
        assertEquals(12.00, profit, EPSILON)
        assertEquals(24.00, margin, EPSILON)
    }

    @Test
    fun `tier 80 a 100 reais aplica 14 por cento mais R$16 fixo e 1 por cento pix subsidy`() {
        // Preço R$90, custo R$30
        // commission = 90 * 0.14 = 12.60
        // fixedFee = 16.00
        // transacao = 90 * 0.02 = 1.80
        // pixSubsidy = 90 * 0.01 = 0.90
        // taxaShopee = 12.60 + 16 + 1.80 - 0.90 = 29.50
        // imposto = 90 * 0.06 = 5.40
        // totalTaxas = 34.90
        // lucro = 90 - 30 - 34.90 = 25.10
        // margem = 25.10/90 * 100 ≈ 27.89%
        val (profit, margin) = calculateProfit(price = 90.0, cost = 30.0)
        assertEquals(25.10, profit, EPSILON)
        assertEquals(27.89, margin, EPSILON)
    }

    @Test
    fun `tier 150 a 300 reais aplica 12 por cento mais R$22 fixo`() {
        // Preço R$200, custo R$80
        // commission = 200 * 0.12 = 24.00
        // fixedFee = 22.00
        // transacao = 200 * 0.02 = 4.00
        // pixSubsidy = 200 * 0.01 = 2.00
        // taxaShopee = 24 + 22 + 4 - 2 = 48.00
        // imposto = 200 * 0.06 = 12.00
        // totalTaxas = 60.00
        // lucro = 200 - 80 - 60 = 60.00
        // margem = 60/200 * 100 = 30.00%
        val (profit, margin) = calculateProfit(price = 200.0, cost = 80.0)
        assertEquals(60.00, profit, EPSILON)
        assertEquals(30.00, margin, EPSILON)
    }

    @Test
    fun `tier 300 a 500 reais aplica 10 por cento mais R$36 fixo e 2 por cento pix subsidy`() {
        // Preço R$400, custo R$150
        // commission = 400 * 0.10 = 40.00
        // fixedFee = 36.00
        // transacao = 400 * 0.02 = 8.00
        // pixSubsidy = 400 * 0.02 = 8.00
        // taxaShopee = 40 + 36 + 8 - 8 = 76.00
        // imposto = 400 * 0.06 = 24.00
        // totalTaxas = 100.00
        // lucro = 400 - 150 - 100 = 150.00
        // margem = 150/400 * 100 = 37.50%
        val (profit, margin) = calculateProfit(price = 400.0, cost = 150.0)
        assertEquals(150.00, profit, EPSILON)
        assertEquals(37.50, margin, EPSILON)
    }

    @Test
    fun `tier 500+ aplica 8 por cento mais R$46 fixo e 2 por cento pix subsidy`() {
        // Preço R$1000, custo R$400
        // commission = 1000 * 0.08 = 80.00
        // fixedFee = 46.00
        // transacao = 1000 * 0.02 = 20.00
        // pixSubsidy = 1000 * 0.02 = 20.00
        // taxaShopee = 80 + 46 + 20 - 20 = 126.00
        // imposto = 1000 * 0.06 = 60.00
        // totalTaxas = 186.00
        // lucro = 1000 - 400 - 186 = 414.00
        // margem = 414/1000 * 100 = 41.40%
        val (profit, margin) = calculateProfit(price = 1000.0, cost = 400.0)
        assertEquals(414.00, profit, EPSILON)
        assertEquals(41.40, margin, EPSILON)
    }

    // ===== Casos extremos =====

    @Test
    fun `preco zero retorna zero lucro e zero margem`() {
        val (profit, margin) = calculateProfit(price = 0.0, cost = 50.0)
        assertEquals(0.0, profit, EPSILON)
        assertEquals(0.0, margin, EPSILON)
    }

    @Test
    fun `custo zero retorna zero lucro e zero margem`() {
        val (profit, margin) = calculateProfit(price = 100.0, cost = 0.0)
        assertEquals(0.0, profit, EPSILON)
        assertEquals(0.0, margin, EPSILON)
    }

    @Test
    fun `ambos zero retorna zero`() {
        val (profit, margin) = calculateProfit(price = 0.0, cost = 0.0)
        assertEquals(0.0, profit, EPSILON)
        assertEquals(0.0, margin, EPSILON)
    }

    @Test
    fun `preco negativo retorna zero`() {
        val (profit, margin) = calculateProfit(price = -10.0, cost = 5.0)
        assertEquals(0.0, profit, EPSILON)
        assertEquals(0.0, margin, EPSILON)
    }

    @Test
    fun `custo negativo retorna zero`() {
        val (profit, margin) = calculateProfit(price = 100.0, cost = -5.0)
        assertEquals(0.0, profit, EPSILON)
        assertEquals(0.0, margin, EPSILON)
    }

    // ===== Boundary tests =====

    @Test
    fun `boundary R$12 - exatamente R$12 cai no tier 12-80`() {
        val tier = findTier(12.0)
        assertEquals(0.20, tier.commission, EPSILON)
        assertEquals(4.00, tier.fixedFee, EPSILON)
    }

    @Test
    fun `boundary R$11,99 - abaixo de R$12 cai no tier 0-12`() {
        val tier = findTier(11.99)
        assertEquals(0.25, tier.commission, EPSILON)
        assertEquals(4.00, tier.fixedFee, EPSILON)
    }

    @Test
    fun `boundary R$500 - exatamente R$500 cai no tier 500+`() {
        val tier = findTier(500.0)
        assertEquals(0.08, tier.commission, EPSILON)
        assertEquals(46.00, tier.fixedFee, EPSILON)
    }

    @Test
    fun `boundary R$499,99 - abaixo de R$500 cai no tier 300-500`() {
        val tier = findTier(499.99)
        assertEquals(0.10, tier.commission, EPSILON)
        assertEquals(36.00, tier.fixedFee, EPSILON)
    }

    // ===== Breakdown =====

    @Test
    fun `breakdown retorna todas componentes da taxa`() {
        val breakdown = breakdownFees(price = 100.0)
        // tier: 100-150
        assertEquals(0.14, breakdown.tier.commission, EPSILON)
        assertEquals(16.00, breakdown.tier.fixedFee, EPSILON)
        // commission: 100 * 0.14 = 14
        assertEquals(14.00, breakdown.commission, EPSILON)
        assertEquals(16.00, breakdown.fixedFee, EPSILON)
        // transaction: 100 * 0.02 = 2
        assertEquals(2.00, breakdown.transaction, EPSILON)
        // pixSubsidy: 100 * 0.01 = 1
        assertEquals(1.00, breakdown.pixSubsidy, EPSILON)
        // governmentTax: 100 * 0.06 = 6
        assertEquals(6.00, breakdown.governmentTax, EPSILON)
        // total = 14 + 16 + 2 - 1 + 6 = 37
        assertEquals(37.00, breakdown.totalFees, EPSILON)
    }

    @Test
    fun `FEE_TIERS tem 7 entradas cobrindo todas faixas`() {
        assertEquals(7, FEE_TIERS.size)
        // Verifica que as faixas são crescentes
        for (i in 1 until FEE_TIERS.size) {
            assertTrue(
                "Tier $i minPrice deve ser > tier anterior",
                FEE_TIERS[i].minPrice > FEE_TIERS[i - 1].minPrice
            )
        }
    }
}