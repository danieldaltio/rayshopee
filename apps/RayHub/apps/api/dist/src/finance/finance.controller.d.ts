import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    getAccounts(): Promise<{
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
    getSummary(yearStr: string, monthStr: string): Promise<any>;
    withdraw(body: {
        amount: number;
        date?: string;
    }): Promise<{
        success: boolean;
        transaction: {
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
        };
    }>;
}
