export declare enum RegimeTributario {
    SIMPLES = "Simples Nacional",
    LUCRO_PRESUMIDO = "Lucro Presumido",
    LUCRO_REAL = "Lucro Real",
    MEI = "MEI"
}
export declare class UpsertCompanyDto {
    razao_social: string;
    nome_fantasia?: string;
    cnpj: string;
    ie?: string;
    im?: string;
    regime_tributario?: string;
    endereco_cep?: string;
    endereco_rua?: string;
    endereco_numero?: string;
    endereco_complemento?: string;
    endereco_bairro?: string;
    endereco_cidade?: string;
    endereco_uf?: string;
    certificado_digital_url?: string;
    certificado_senha_hash?: string;
    logo_url?: string;
    nfe_serie?: string;
    nfe_proximo_numero?: number;
    nfe_ambiente?: string;
    nfe_provedor?: string;
    imposto_calculo_tipo?: string;
    cst_csosn_padrao?: string;
    cst_pis_cofins?: string;
    aliquota_simples?: number;
    impostos_config?: any;
    certificado_base64?: string;
}
