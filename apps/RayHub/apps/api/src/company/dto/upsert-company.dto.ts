import {
  IsString,
  IsOptional,
  Length,
  Matches,
  IsEnum,
} from 'class-validator';

export enum RegimeTributario {
  SIMPLES = 'Simples Nacional',
  LUCRO_PRESUMIDO = 'Lucro Presumido',
  LUCRO_REAL = 'Lucro Real',
  MEI = 'MEI',
}

export class UpsertCompanyDto {
  @IsString()
  razao_social: string;

  @IsOptional()
  @IsString()
  nome_fantasia?: string;

  @IsString()
  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos (sem pontuação)' })
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter apenas números' })
  cnpj: string;

  @IsOptional()
  @IsString()
  ie?: string;

  @IsOptional()
  @IsString()
  im?: string;

  @IsOptional()
  @IsEnum(RegimeTributario)
  regime_tributario?: string;

  @IsOptional()
  @IsString()
  endereco_cep?: string;

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
  @Length(2, 2)
  endereco_uf?: string;

  @IsOptional()
  @IsString()
  certificado_digital_url?: string;

  @IsOptional()
  @IsString()
  certificado_senha_hash?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  // Configurações NF-e
  @IsOptional()
  @IsString()
  nfe_serie?: string;

  @IsOptional()
  nfe_proximo_numero?: number;

  @IsOptional()
  @IsString()
  nfe_ambiente?: string;

  @IsOptional()
  @IsString()
  nfe_provedor?: string;

  // Classe de Impostos
  @IsOptional()
  @IsString()
  imposto_calculo_tipo?: string;

  @IsOptional()
  @IsString()
  cst_csosn_padrao?: string;

  @IsOptional()
  @IsString()
  cst_pis_cofins?: string;

  @IsOptional()
  aliquota_simples?: number;

  @IsOptional()
  impostos_config?: any;

  @IsOptional()
  @IsString()
  certificado_base64?: string;
}
