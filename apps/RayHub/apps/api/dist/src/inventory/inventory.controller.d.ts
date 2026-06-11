import { InventoryService } from './inventory.service';
import { MovementType } from '@prisma/client';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getLocations(): Promise<{
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
    getSummary(): Promise<{
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
    createMovement(body: {
        type: MovementType;
        quantity: number;
        productId: string;
        sourceLocId?: string;
        destLocId?: string;
        reason?: string;
    }): Promise<{
        success: boolean;
        movement: {
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
        };
    }>;
}
