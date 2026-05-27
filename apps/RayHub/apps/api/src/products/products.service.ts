import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as Papa from 'papaparse';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(take = 50, skip = 0) {
    const [rawItems, total] = await Promise.all([
      this.prisma.products.findMany({
        where: { is_active: true },
        take,
        skip,
        orderBy: { last_sync: 'desc' },
      }),
      this.prisma.products.count({ where: { is_active: true } }),
    ]);

    const items = rawItems.map(item => ({
      ...item,
      item_id: item.item_id.toString(),
      model_id: item.model_id.toString(),
    }));

    return {
      data: items,
      meta: { total, limit: take, skip },
    };
  }

  async findById(id: string) {
    const item = await this.prisma.products.findUniqueOrThrow({
      where: { id },
    });
    return {
      ...item,
      item_id: item.item_id.toString(),
      model_id: item.model_id.toString(),
    };
  }

  async create(dto: CreateProductDto) {
    const item = await this.prisma.products.create({
      data: {
        // IDs Shopee: 0 se criado manualmente (sem sync)
        item_id: BigInt(0),
        model_id: BigInt(0),
        name: dto.name,
        variation_name: dto.variation_name,
        sku: dto.sku,
        GTIN_EAN_BarCode: dto.GTIN_EAN_BarCode,
        shopee_price: dto.shopee_price,
        shopee_stock: dto.shopee_stock,
        cost: dto.cost ?? 0,
        ncm: dto.ncm,
        cfop: dto.cfop,
        cst_csosn: dto.cst_csosn,
        unidade: dto.unidade ?? 'UN',
        peso: dto.peso,
        altura: dto.altura,
        largura: dto.largura,
        comprimento: dto.comprimento,
        estoque_minimo: dto.estoque_minimo ?? 0,
        imagem_url: dto.imagem_url,
        is_active: true,
      },
    });
    return {
      ...item,
      item_id: item.item_id.toString(),
      model_id: item.model_id.toString(),
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    const item = await this.prisma.products.update({
      where: { id },
      data: { ...dto },
    });
    return {
      ...item,
      item_id: item.item_id.toString(),
      model_id: item.model_id.toString(),
    };
  }

  async deactivate(id: string) {
    return this.prisma.products.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async importProducts(buffer: Buffer, source: 'bling' | 'upseller') {
    const csvString = buffer.toString('utf8');
    
    // Configurações do papaparse
    const parsed = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      console.warn('PapaParse warnings:', parsed.errors);
    }

    const rows = parsed.data as any[];
    let updatedCount = 0;
    let notFoundCount = 0;

    // Campos de mapeamento baseados na origem
    for (const row of rows) {
      let sku = '';
      let ncm = '';
      let cost = 0;
      let weight = 0;

      if (source === 'bling') {
        sku = row['Código'] || row['codigo'] || '';
        ncm = row['NCM'] || row['ncm'] || '';
        cost = parseFloat(row['Preço Custo'] || row['preco_custo'] || '0');
        weight = parseFloat(row['Peso líquido'] || row['peso_liquido'] || '0');
      } else if (source === 'upseller') {
        sku = row['SKU do Produto'] || row['SKU'] || '';
        ncm = row['NCM'] || '';
        cost = parseFloat(row['Custo'] || row['Preço de Custo'] || '0');
        weight = parseFloat(row['Peso (kg)'] || row['Peso'] || '0');
      }

      if (!sku) continue;

      // Buscar produto local
      const localProduct = await this.prisma.products.findFirst({
        where: { sku: sku }
      });

      if (localProduct) {
        await this.prisma.products.update({
          where: { id: localProduct.id },
          data: {
            ncm: ncm || localProduct.ncm,
            cost: cost > 0 ? cost : localProduct.cost,
            peso: weight > 0 ? weight : localProduct.peso,
          }
        });
        updatedCount++;
      } else {
        notFoundCount++;
      }
    }

    return {
      total: rows.length,
      updated: updatedCount,
      notFound: notFoundCount,
    };
  }
}
