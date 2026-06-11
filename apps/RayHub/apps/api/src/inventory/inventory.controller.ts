import { Controller, Get, Post, Body, UseGuards, UseInterceptors, UnauthorizedException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { TenantInterceptor } from '../common/tenant/tenant.interceptor';
import { getCurrentTenantId } from '../common/tenant/tenant.context';
import { MovementType } from '@prisma/client';

@Controller('inventory')
@UseGuards(SupabaseAuthGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('locations')
  async getLocations() {
    const companyId = getCurrentTenantId();
    if (!companyId) throw new UnauthorizedException('Tenant ID missing');
    return this.inventoryService.ensureDefaultLocations(companyId);
  }

  @Get('summary')
  async getSummary() {
    const companyId = getCurrentTenantId();
    if (!companyId) throw new UnauthorizedException('Tenant ID missing');
    return this.inventoryService.getInventorySummary(companyId);
  }

  @Post('movement')
  async createMovement(@Body() body: {
    type: MovementType;
    quantity: number;
    productId: string;
    sourceLocId?: string;
    destLocId?: string;
    reason?: string;
  }) {
    const companyId = getCurrentTenantId();
    if (!companyId) throw new UnauthorizedException('Tenant ID missing');
    
    const tx = await this.inventoryService.registerMovement({
      ...body,
      companyId,
    });
    return { success: true, movement: tx };
  }
}
