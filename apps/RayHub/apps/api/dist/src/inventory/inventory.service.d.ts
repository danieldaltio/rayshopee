import { PrismaService } from '../prisma/prisma.service';
import { MovementType } from '@prisma/client';
export declare class InventoryService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    ensureDefaultLocations(companyId: string): Promise<{
        main: {
            id: string;
            name: string;
            company_id: string;
            created_at: Date;
            updated_at: Date;
            is_default: boolean;
            is_defect: boolean;
        };
        defect: {
            id: string;
            name: string;
            company_id: string;
            created_at: Date;
            updated_at: Date;
            is_default: boolean;
            is_defect: boolean;
        };
    }>;
    registerMovement(data: {
        type: MovementType;
        quantity: number;
        productId: string;
        sourceLocId?: string;
        destLocId?: string;
        reason?: string;
        userId?: string;
        orderId?: string;
        companyId: string;
    }): Promise<{
        id: string;
        company_id: string;
        created_at: Date;
        order_id: string | null;
        product_id: string;
        user_id: string | null;
        type: import("@prisma/client").$Enums.MovementType;
        quantity: number;
        reason: string | null;
        source_loc_id: string | null;
        dest_loc_id: string | null;
    }>;
    getInventorySummary(companyId: string): Promise<{
        locations: {
            id: string;
            name: string;
            company_id: string;
            created_at: Date;
            updated_at: Date;
            is_default: boolean;
            is_defect: boolean;
        }[];
        totalAvailable: number;
    }>;
}
