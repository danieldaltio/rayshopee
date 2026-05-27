import { PrismaService } from '../prisma/prisma.service';
export declare class ShopeeService {
    private prisma;
    private readonly partnerId;
    private readonly partnerKey;
    private readonly redirectUrl;
    private readonly baseUrl;
    constructor(prisma: PrismaService);
    private sign;
    getAuthUrl(): string;
    getAccessToken(code: string, shopId: number): Promise<{
        access_token: string;
        refresh_token: string;
        expire_in: number;
    }>;
    saveTokens(shopId: number, accessToken: string, refreshToken: string, expireIn: number): Promise<{
        id: string;
        cnpj: string;
        razao_social: string;
        nome_fantasia: string | null;
        ie: string | null;
        im: string | null;
        regime_tributario: string | null;
        endereco_cep: string | null;
        endereco_rua: string | null;
        endereco_numero: string | null;
        endereco_complemento: string | null;
        endereco_bairro: string | null;
        endereco_cidade: string | null;
        endereco_uf: string | null;
        certificado_digital_url: string | null;
        certificado_senha_hash: string | null;
        logo_url: string | null;
        nfe_serie: string | null;
        nfe_proximo_numero: number | null;
        nfe_ambiente: string | null;
        nfe_provedor: string | null;
        imposto_calculo_tipo: string | null;
        cst_csosn_padrao: string | null;
        cst_pis_cofins: string | null;
        aliquota_simples: import("@prisma/client-runtime-utils").Decimal | null;
        impostos_config: import("@prisma/client/runtime/client").JsonValue | null;
        shopee_shop_id: string | null;
        shopee_access_token: string | null;
        shopee_refresh_token: string | null;
        shopee_token_expires_at: Date | null;
        created_at: Date;
        updated_at: Date;
    } | undefined>;
    refreshAccessToken(shopId: number, refreshToken: string): Promise<any>;
    getIntegrationStatus(): Promise<{
        connected: boolean;
        shopId?: undefined;
        expiresAt?: undefined;
    } | {
        connected: boolean;
        shopId: string;
        expiresAt?: undefined;
    } | {
        connected: boolean;
        shopId: string;
        expiresAt: Date | null;
    }>;
    requestBusinessApi(method: 'get' | 'post', path: string, params?: any, body?: any): Promise<any>;
    syncProducts(): Promise<number>;
    syncOrders(): Promise<number>;
}
