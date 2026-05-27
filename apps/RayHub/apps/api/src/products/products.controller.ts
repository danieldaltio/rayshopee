import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ShopeeService } from '../shopee/shopee.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly shopeeService: ShopeeService,
  ) {}

  @Post('sync')
  async syncShopee() {
    try {
      const count = await this.shopeeService.syncProducts();
      return { success: true, count };
    } catch (error: any) {
      if (error.message && error.message.includes('Shopee is not connected')) {
        throw new HttpException(
          'Sua conta da Shopee não está conectada. Acesse Configurações -> Integrações e conecte antes de sincronizar.',
          HttpStatus.BAD_REQUEST
        );
      }
      throw new HttpException(
        error.message || 'Erro interno na sincronização',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(
    @UploadedFile() file: Express.Multer.File,
    @Body('source') source: 'bling' | 'upseller',
  ) {
    if (!file) {
      throw new HttpException('Arquivo não fornecido', HttpStatus.BAD_REQUEST);
    }
    
    try {
      const result = await this.productsService.importProducts(file.buffer, source);
      return { success: true, ...result };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Erro interno na importação',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  findAll(@Query('take') take?: string, @Query('skip') skip?: string) {
    const limit = take ? parseInt(take, 10) : 50;
    const offset = skip ? parseInt(skip, 10) : 0;
    return this.productsService.findAll(limit, offset);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.productsService.deactivate(id);
  }
}
