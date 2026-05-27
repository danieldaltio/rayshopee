import {
  Controller,
  Get,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('search') search?: string,
  ) {
    const limit = take ? parseInt(take, 10) : 50;
    const offset = skip ? parseInt(skip, 10) : 0;
    return this.invoicesService.findAll(limit, offset, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Post('emit/:orderId')
  emitInvoice(@Param('orderId') orderId: string) {
    return this.invoicesService.emitInvoice(orderId);
  }
}
