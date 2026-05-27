import { Controller, Get, Post, Query, Redirect, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ShopeeService } from './shopee.service';

@Controller('shopee')
export class ShopeeController {
  constructor(private readonly shopeeService: ShopeeService) {}

  /**
   * Returns the Shopee authorization URL.
   * Frontend calls this and redirects the user to Shopee.
   */
  @Get('auth-url')
  getAuthUrl() {
    const url = this.shopeeService.getAuthUrl();
    return { url };
  }

  /**
   * Shopee's OAuth callback endpoint.
   * Shopee redirects here after the merchant grants permissions.
   * Query params: code, shop_id
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('shop_id') shopId: string,
    @Res() res: Response,
  ) {
    try {
      const shopIdNum = parseInt(shopId, 10);

      // Exchange the code for tokens
      const tokenData = await this.shopeeService.getAccessToken(code, shopIdNum);

      // Persist the tokens
      await this.shopeeService.saveTokens(
        shopIdNum,
        tokenData.access_token,
        tokenData.refresh_token,
        tokenData.expire_in,
      );

      // Redirect back to settings page with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/configuracoes?shopee=connected`);

      // Trigger automatic background sync!
      this.shopeeService.syncProducts()
        .then(() => this.shopeeService.syncOrders())
        .then(count => console.log(`Auto-sync completed. Synced ${count} orders.`))
        .catch(err => console.error('Auto-sync failed:', err));

    } catch (error) {
      console.error('Shopee callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/configuracoes?shopee=error`);
    }
  }

  /**
   * Returns the current Shopee integration status for the settings page.
   */
  @Get('status')
  getStatus() {
    return this.shopeeService.getIntegrationStatus();
  }

  /**
   * Manual trigger to sync orders (useful for testing or manual updates).
   */
  @Post('sync-orders')
  async syncOrders() {
    const count = await this.shopeeService.syncOrders();
    return { success: true, count };
  }
}
