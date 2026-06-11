import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, TransactionStatus, TransactionType } from '@prisma/client';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Inicializa as contas básicas se não existirem (Conta Física e Saldo Shopee).
   */
  async ensureBasicAccounts(companyId: string) {
    let checking = await this.prisma.bankAccount.findFirst({
      where: { type: 'CHECKING' },
    });

    if (!checking) {
      checking = await this.prisma.bankAccount.create({
        data: {
          name: 'Conta Corrente Principal',
          type: 'CHECKING',
          is_default: true,
          company_id: companyId,
        },
      });
    }

    let wallet = await this.prisma.bankAccount.findFirst({
      where: { type: 'WALLET' },
    });

    if (!wallet) {
      wallet = await this.prisma.bankAccount.create({
        data: {
          name: 'Saldo Shopee',
          type: 'WALLET',
          is_default: false,
          company_id: companyId,
        },
      });
    }

    return { checking, wallet };
  }

  /**
   * Inicializa categorias padrões financeiras do sistema.
   */
  async ensureSystemCategories(companyId: string) {
    const categories = [
      { name: 'Receita de Venda (Shopee)', type: TransactionType.INCOME, color: '#10B981', is_system: true },
      { name: 'Comissão Marketplace (Shopee)', type: TransactionType.EXPENSE, color: '#EF4444', is_system: true },
      { name: 'Frete e Envios', type: TransactionType.EXPENSE, color: '#F59E0B', is_system: true },
      { name: 'Impostos', type: TransactionType.EXPENSE, color: '#6366F1', is_system: false },
    ];

    const results = [];
    for (const cat of categories) {
      let existing = await this.prisma.transactionCategory.findFirst({
        where: { name: cat.name, type: cat.type },
      });
      if (!existing) {
        existing = await this.prisma.transactionCategory.create({
          data: { ...cat, company_id: companyId },
        });
      }
      results.push(existing);
    }
    return results;
  }

  /**
   * Registra a venda originada da Shopee, dividindo a Receita Bruta, a Taxa e o Frete.
   * Estes valores caem na WALLET (Saldo Shopee).
   */
  async registerShopeeSale(data: {
    orderId: string;
    companyId: string;
    subtotal: number;
    shopeeFee: number;
    shippingFee: number;
    orderDate: Date;
    orderNumber: string;
  }) {
    // Evita duplicação de financeiro para o mesmo pedido
    const existingTx = await this.prisma.financialTransaction.findFirst({
      where: { order_id: data.orderId, type: 'INCOME' }
    });
    if (existingTx) return;

    const { wallet } = await this.ensureBasicAccounts(data.companyId);
    const categories = await this.ensureSystemCategories(data.companyId);
    
    const catIncome = categories.find(c => c.name.includes('Receita'));
    const catFee = categories.find(c => c.name.includes('Comissão'));
    const catShipping = categories.find(c => c.name.includes('Frete'));

    // 1. Registrar Receita Bruta (Subtotal)
    await this.prisma.financialTransaction.create({
      data: {
        description: `Venda Shopee - Pedido #${data.orderNumber}`,
        type: 'INCOME',
        amount: data.subtotal,
        status: 'PAID', // O dinheiro cai na carteira da Shopee
        competency_date: data.orderDate,
        payment_date: data.orderDate, // Data que faturou na shopee
        account_id: wallet.id,
        category_id: catIncome!.id,
        order_id: data.orderId,
        order_source: 'shopee',
        company_id: data.companyId,
      }
    });

    // 2. Registrar Taxa da Shopee
    if (data.shopeeFee > 0) {
      await this.prisma.financialTransaction.create({
        data: {
          description: `Taxa Marketplace - Pedido #${data.orderNumber}`,
          type: 'EXPENSE',
          amount: data.shopeeFee,
          status: 'PAID',
          competency_date: data.orderDate,
          payment_date: data.orderDate,
          account_id: wallet.id,
          category_id: catFee!.id,
          order_id: data.orderId,
          order_source: 'shopee',
          company_id: data.companyId,
        }
      });
    }

    // 3. Registrar Frete (se houver desconto de frete do seller)
    if (data.shippingFee > 0) {
      await this.prisma.financialTransaction.create({
        data: {
          description: `Custo de Frete - Pedido #${data.orderNumber}`,
          type: 'EXPENSE',
          amount: data.shippingFee,
          status: 'PAID',
          competency_date: data.orderDate,
          payment_date: data.orderDate,
          account_id: wallet.id,
          category_id: catShipping!.id,
          order_id: data.orderId,
          order_source: 'shopee',
          company_id: data.companyId,
        }
      });
    }

    // Atualiza saldo da carteira
    const netAmount = data.subtotal - data.shopeeFee - data.shippingFee;
    await this.prisma.bankAccount.update({
      where: { id: wallet.id },
      data: { current_balance: { increment: netAmount } }
    });

    this.logger.log(`Financeiro do pedido ${data.orderNumber} registrado. Líquido: ${netAmount}`);
  }

  /**
   * Saque do saldo da Shopee para a Conta Bancária.
   */
  async withdrawFromWallet(companyId: string, amount: number, date: Date) {
    const { checking, wallet } = await this.ensureBasicAccounts(companyId);

    // Cria a transação de transferência (Saída da WALLET, Entrada na CHECKING)
    const tx = await this.prisma.financialTransaction.create({
      data: {
        description: 'Repasse / Saque da Shopee',
        type: 'TRANSFER',
        amount: amount,
        status: 'PAID',
        competency_date: date,
        payment_date: date,
        account_id: wallet.id, // Da onde sai
        destination_account_id: checking.id, // Para onde vai
        company_id: companyId,
      }
    });

    // Atualiza saldos
    await this.prisma.bankAccount.update({
      where: { id: wallet.id },
      data: { current_balance: { decrement: amount } }
    });

    await this.prisma.bankAccount.update({
      where: { id: checking.id },
      data: { current_balance: { increment: amount } }
    });

    return tx;
  }

  /**
   * Resumo Financeiro (DRE Simplificada) do Mês
   */
  async getMonthlySummary(companyId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        company_id: companyId,
        status: 'PAID',
        competency_date: {
          gte: startDate,
          lte: endDate,
        },
        type: { in: ['INCOME', 'EXPENSE'] }
      },
      include: {
        category: true,
      }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let shopeeFees = 0;

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      if (tx.type === 'INCOME') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        if (tx.category?.name.includes('Comissão')) {
          shopeeFees += amount;
        }
      }
    }

    return {
      gross_revenue: totalIncome,
      total_expenses: totalExpense,
      shopee_fees: shopeeFees,
      net_profit: totalIncome - totalExpense,
      profit_margin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
    };
  }
}
