"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FinanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let FinanceService = FinanceService_1 = class FinanceService {
    prisma;
    logger = new common_1.Logger(FinanceService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureBasicAccounts(companyId) {
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
    async ensureSystemCategories(companyId) {
        const categories = [
            { name: 'Receita de Venda (Shopee)', type: client_1.TransactionType.INCOME, color: '#10B981', is_system: true },
            { name: 'Comissão Marketplace (Shopee)', type: client_1.TransactionType.EXPENSE, color: '#EF4444', is_system: true },
            { name: 'Frete e Envios', type: client_1.TransactionType.EXPENSE, color: '#F59E0B', is_system: true },
            { name: 'Impostos', type: client_1.TransactionType.EXPENSE, color: '#6366F1', is_system: false },
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
    async registerShopeeSale(data) {
        const existingTx = await this.prisma.financialTransaction.findFirst({
            where: { order_id: data.orderId, type: 'INCOME' }
        });
        if (existingTx)
            return;
        const { wallet } = await this.ensureBasicAccounts(data.companyId);
        const categories = await this.ensureSystemCategories(data.companyId);
        const catIncome = categories.find(c => c.name.includes('Receita'));
        const catFee = categories.find(c => c.name.includes('Comissão'));
        const catShipping = categories.find(c => c.name.includes('Frete'));
        await this.prisma.financialTransaction.create({
            data: {
                description: `Venda Shopee - Pedido #${data.orderNumber}`,
                type: 'INCOME',
                amount: data.subtotal,
                status: 'PAID',
                competency_date: data.orderDate,
                payment_date: data.orderDate,
                account_id: wallet.id,
                category_id: catIncome.id,
                order_id: data.orderId,
                order_source: 'shopee',
                company_id: data.companyId,
            }
        });
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
                    category_id: catFee.id,
                    order_id: data.orderId,
                    order_source: 'shopee',
                    company_id: data.companyId,
                }
            });
        }
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
                    category_id: catShipping.id,
                    order_id: data.orderId,
                    order_source: 'shopee',
                    company_id: data.companyId,
                }
            });
        }
        const netAmount = data.subtotal - data.shopeeFee - data.shippingFee;
        await this.prisma.bankAccount.update({
            where: { id: wallet.id },
            data: { current_balance: { increment: netAmount } }
        });
        this.logger.log(`Financeiro do pedido ${data.orderNumber} registrado. Líquido: ${netAmount}`);
    }
    async withdrawFromWallet(companyId, amount, date) {
        const { checking, wallet } = await this.ensureBasicAccounts(companyId);
        const tx = await this.prisma.financialTransaction.create({
            data: {
                description: 'Repasse / Saque da Shopee',
                type: 'TRANSFER',
                amount: amount,
                status: 'PAID',
                competency_date: date,
                payment_date: date,
                account_id: wallet.id,
                destination_account_id: checking.id,
                company_id: companyId,
            }
        });
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
    async getMonthlySummary(companyId, year, month) {
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
            }
            else {
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
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = FinanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map