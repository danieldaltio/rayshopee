import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { MockInjectOrderDto } from './dto/mock-inject.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const limit = take ? parseInt(take, 10) : 50;
    const offset = skip ? parseInt(skip, 10) : 0;
    return this.ordersService.findAll(limit, offset, status, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post('mock-inject')
  injectMock(@Body() dto: MockInjectOrderDto) {
    return this.ordersService.injectMock(dto);
  }
}
