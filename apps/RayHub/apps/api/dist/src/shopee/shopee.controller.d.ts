import type { Response } from 'express';
import { ShopeeService } from './shopee.service';
export declare class ShopeeController {
    private readonly shopeeService;
    constructor(shopeeService: ShopeeService);
    getAuthUrl(): {
        url: string;
    };
    handleCallback(code: string, shopId: string, res: Response): Promise<void>;
    getStatus(): Promise<{
        connected: boolean;
        shopId?: undefined;
        expiresAt?: undefined;
    } | {
        connected: boolean;
        shopId: string;
        expiresAt?: undefined;
    } | {
        connected: boolean;
        shopId: string;
        expiresAt: Date | null;
    }>;
    syncOrders(): Promise<{
        success: boolean;
        count: number;
    }>;
}
