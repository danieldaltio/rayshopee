import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(take?: number, skip?: number, search?: string): Promise<{
        data: {
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
        }[];
        meta: {
            total: number;
            limit: number;
            skip: number;
        };
    }>;
    findById(id: string): Promise<{
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
    }>;
    create(dto: CreateCustomerDto): Promise<{
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
    }>;
    update(id: string, dto: UpdateCustomerDto): Promise<{
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
    }>;
}
