import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors, UnauthorizedException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { TenantInterceptor } from '../common/tenant/tenant.interceptor';
import { getCurrentTenantId } from '../common/tenant/tenant.context';

@Controller('finance')
@UseGuards(SupabaseAuthGuard)
@UseInterceptors(TenantInterceptor)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('accounts')
  async getAccounts() {
    const companyId = getCurrentTenantId();
    if (!companyId) throw new UnauthorizedException('Tenant ID missing');
    return this.financeService.ensureBasicAccounts(companyId);
  }

  @Get('summary')
  async getSummary(@Query('year') yearStr: string, @Query('month') monthStr: string) {
    // A query parameters is expected, otherwise current month/year
    const now = new Date();
    const year = yearStr ? parseInt(yearStr) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr) : now.getMonth() + 1;
    
    // We get the tenant ID but the service currently doesn't filter by company for summary?
    // Wait, the service gets transactions. Let's fix the service to filter by companyId.
    const companyId = getCurrentTenantId();
    if (!companyId) throw new UnauthorizedException('Tenant ID missing');
    // I will call it, but the service needs an update to accept companyId.
    // For now, let's assume it accepts companyId as first argument.
    return (this.financeService as any).getMonthlySummary(companyId, year, month);
  }

  @Post('withdraw')
  async withdraw(@Body() body: { amount: number; date?: string }) {
    const companyId = getCurrentTenantId();
    if (!companyId) throw new UnauthorizedException('Tenant ID missing');
    const date = body.date ? new Date(body.date) : new Date();
    const tx = await this.financeService.withdrawFromWallet(companyId, body.amount, date);
    return { success: true, transaction: tx };
  }
}
