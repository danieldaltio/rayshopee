import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  cpf_cnpj?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  endereco_rua?: string;

  @IsOptional()
  @IsString()
  endereco_numero?: string;

  @IsOptional()
  @IsString()
  endereco_complemento?: string;

  @IsOptional()
  @IsString()
  endereco_bairro?: string;

  @IsOptional()
  @IsString()
  endereco_cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  endereco_uf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  endereco_cep?: string;

  @IsOptional()
  @IsString()
  shopee_buyer_username?: string;
}
