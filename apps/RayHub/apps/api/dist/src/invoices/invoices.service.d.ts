import { PrismaService } from '../prisma/prisma.service';
export declare class InvoicesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(take?: number, skip?: number, search?: string): Promise<{
        data: ({
            order: {
                customer: {
                    name: string;
                    id: string;
                    endereco_cep: string | null;
                    endereco_rua: string | null;
                    endereco_numero: string | null;
                    endereco_complemento: string | null;
                    endereco_bairro: string | null;
                    endereco_cidade: string | null;
                    endereco_uf: string | null;
                    created_at: Date;
                    updated_at: Date;
                    cpf_cnpj: string | null;
                    email: string | null;
                    telefone: string | null;
                    shopee_buyer_username: string | null;
                };
            } & {
                id: string;
                total: import("@prisma/client-runtime-utils").Decimal;
                shopee_order_sn: string | null;
                numero: string | null;
                status: string;
                canal: string;
                customer_id: string;
                subtotal: import("@prisma/client-runtime-utils").Decimal;
                frete: import("@prisma/client-runtime-utils").Decimal;
                desconto: import("@prisma/client-runtime-utils").Decimal;
                shopee_comissao: import("@prisma/client-runtime-utils").Decimal | null;
                shopee_status: string | null;
                data_pedido: Date;
                data_atualizacao: Date;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            numero: string | null;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            order_id: string;
            serie: string | null;
            tipo: import("@prisma/client").$Enums.InvoiceType;
            chave_acesso: string | null;
            protocolo: string | null;
            xml_url: string | null;
            danfe_pdf_url: string | null;
            emitida_em: Date | null;
            sefaz_mensagem: string | null;
            dados_completos_json: import("@prisma/client/runtime/client").JsonValue | null;
        })[];
        meta: {
            total: number;
            limit: number;
            skip: number;
        };
    }>;
    findById(id: string): Promise<{
        order: {
            customer: {
                name: string;
                id: string;
                endereco_cep: string | null;
                endereco_rua: string | null;
                endereco_numero: string | null;
                endereco_complemento: string | null;
                endereco_bairro: string | null;
                endereco_cidade: string | null;
                endereco_uf: string | null;
                created_at: Date;
                updated_at: Date;
                cpf_cnpj: string | null;
                email: string | null;
                telefone: string | null;
                shopee_buyer_username: string | null;
            };
            items: ({
                product: {
                    name: string;
                    variation_name: string | null;
                    sku: string | null;
                    GTIN_EAN_BarCode: string | null;
                    shopee_price: import("@prisma/client-runtime-utils").Decimal;
                    shopee_stock: number;
                    cost: import("@prisma/client-runtime-utils").Decimal | null;
                    ncm: string | null;
                    cfop: string | null;
                    cst_csosn: string | null;
                    unidade: string;
                    peso: import("@prisma/client-runtime-utils").Decimal | null;
                    altura: import("@prisma/client-runtime-utils").Decimal | null;
                    largura: import("@prisma/client-runtime-utils").Decimal | null;
                    comprimento: import("@prisma/client-runtime-utils").Decimal | null;
                    estoque_minimo: number;
                    imagem_url: string | null;
                    id: string;
                    item_id: bigint;
                    model_id: bigint;
                    is_active: boolean | null;
                    last_sync: Date | null;
                    categoria_id: string | null;
                };
            } & {
                id: string;
                subtotal: import("@prisma/client-runtime-utils").Decimal;
                order_id: string;
                quantidade: number;
                preco_unitario: import("@prisma/client-runtime-utils").Decimal;
                product_id: string;
            })[];
        } & {
            id: string;
            total: import("@prisma/client-runtime-utils").Decimal;
            shopee_order_sn: string | null;
            numero: string | null;
            status: string;
            canal: string;
            customer_id: string;
            subtotal: import("@prisma/client-runtime-utils").Decimal;
            frete: import("@prisma/client-runtime-utils").Decimal;
            desconto: import("@prisma/client-runtime-utils").Decimal;
            shopee_comissao: import("@prisma/client-runtime-utils").Decimal | null;
            shopee_status: string | null;
            data_pedido: Date;
            data_atualizacao: Date;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        numero: string | null;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        order_id: string;
        serie: string | null;
        tipo: import("@prisma/client").$Enums.InvoiceType;
        chave_acesso: string | null;
        protocolo: string | null;
        xml_url: string | null;
        danfe_pdf_url: string | null;
        emitida_em: Date | null;
        sefaz_mensagem: string | null;
        dados_completos_json: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    emitInvoice(orderId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        numero: string | null;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        order_id: string;
        serie: string | null;
        tipo: import("@prisma/client").$Enums.InvoiceType;
        chave_acesso: string | null;
        protocolo: string | null;
        xml_url: string | null;
        danfe_pdf_url: string | null;
        emitida_em: Date | null;
        sefaz_mensagem: string | null;
        dados_completos_json: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
