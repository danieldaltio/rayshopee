import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ShopeeModule } from '../shopee/shopee.module';

@Module({
  imports: [ShopeeModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
