declare class MockCustomerDto {
    name: string;
    cpf_cnpj?: string;
    shopee_buyer_username?: string;
    endereco_rua?: string;
    endereco_numero?: string;
    endereco_cidade?: string;
    endereco_uf?: string;
    endereco_cep?: string;
}
declare class MockOrderItemDto {
    product_id: string;
    quantidade: number;
    preco_unitario: number;
}
export declare class MockInjectOrderDto {
    shopee_order_sn: string;
    status: string;
    subtotal: number;
    frete: number;
    desconto?: number;
    total: number;
    shopee_comissao?: number;
    customer: MockCustomerDto;
    items: MockOrderItemDto[];
}
export {};
