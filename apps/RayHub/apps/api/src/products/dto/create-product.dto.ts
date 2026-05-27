import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
  IsBoolean,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  variation_name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  GTIN_EAN_BarCode?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  shopee_price: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shopee_stock: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cost?: number;

  // Campos fiscais
  @IsString()
  @Length(8, 8, { message: 'NCM deve ter exatamente 8 dígitos' })
  @Matches(/^\d{8}$/, { message: 'NCM deve conter apenas números' })
  ncm: string;

  @IsString()
  @Length(4, 4, { message: 'CFOP deve ter exatamente 4 dígitos' })
  @Matches(/^\d{4}$/, { message: 'CFOP deve conter apenas números' })
  cfop: string;

  @IsOptional()
  @IsString()
  cst_csosn?: string;

  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  peso?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  altura?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  largura?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  comprimento?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estoque_minimo?: number;

  @IsOptional()
  @IsString()
  imagem_url?: string;
}
