import { PrismaService } from '../prisma/prisma.service';
export declare class FinanceService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    ensureBasicAccounts(companyId: string): Promise<{
        checking: {
            id: string;
            name: string;
            company_id: string;
            created_at: Date;
            updated_at: Date;
            is_active: boolean;
            type: import("@prisma/client").$Enums.AccountType;
            initial_balance: import("@prisma/client-runtime-utils").Decimal;
            current_balance: import("@prisma/client-runtime-utils").Decimal;
            is_default: boolean;
        };
        wallet: {
            id: string;
            name: string;
            company_id: string;
            created_at: Date;
            updated_at: Date;
            is_active: boolean;
            type: import("@prisma/client").$Enums.AccountType;
            initial_balance: import("@prisma/client-runtime-utils").Decimal;
            current_balance: import("@prisma/client-runtime-utils").Decimal;
            is_default: boolean;
        };
    }>;
    ensureSystemCategories(companyId: string): Promise<{
        id: string;
        name: string;
        company_id: string;
        created_at: Date;
        updated_at: Date;
        type: import("@prisma/client").$Enums.TransactionType;
        color: string | null;
        is_system: boolean;
    }[]>;
    registerShopeeSale(data: {
        orderId: string;
        companyId: string;
        subtotal: number;
        shopeeFee: number;
        shippingFee: number;
        orderDate: Date;
        orderNumber: string;
    }): Promise<void>;
    withdrawFromWallet(companyId: string, amount: number, date: Date): Promise<{
        id: string;
        company_id: string;
        created_at: Date;
        updated_at: Date;
        status: import("@prisma/client").$Enums.TransactionStatus;
        order_id: string | null;
        type: import("@prisma/client").$Enums.TransactionType;
        description: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
        competency_date: Date;
        payment_date: Date | null;
        account_id: string;
        destination_account_id: string | null;
        category_id: string | null;
        order_source: string | null;
    }>;
    getMonthlySummary(companyId: string, year: number, month: number): Promise<{
        gross_revenue: number;
        total_expenses: number;
        shopee_fees: number;
        net_profit: number;
        profit_margin: number;
    }>;
}
