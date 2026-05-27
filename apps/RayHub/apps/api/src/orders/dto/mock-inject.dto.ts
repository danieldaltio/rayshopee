import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class MockCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  cpf_cnpj?: string;

  @IsOptional()
  @IsString()
  shopee_buyer_username?: string;

  @IsOptional()
  @IsString()
  endereco_rua?: string;

  @IsOptional()
  @IsString()
  endereco_numero?: string;

  @IsOptional()
  @IsString()
  endereco_cidade?: string;

  @IsOptional()
  @IsString()
  endereco_uf?: string;

  @IsOptional()
  @IsString()
  endereco_cep?: string;
}

class MockOrderItemDto {
  @IsString()
  product_id: string;

  @IsNumber()
  quantidade: number;

  @IsNumber()
  preco_unitario: number;
}

export class MockInjectOrderDto {
  @IsString()
  shopee_order_sn: string;

  @IsString()
  status: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  frete: number;

  @IsOptional()
  @IsNumber()
  desconto?: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsNumber()
  shopee_comissao?: number;

  @IsObject()
  @ValidateNested()
  @Type(() => MockCustomerDto)
  customer: MockCustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MockOrderItemDto)
  items: MockOrderItemDto[];
}
