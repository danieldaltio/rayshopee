import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(take = 50, skip = 0, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { cpf_cnpj: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        take,
        skip,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, limit: take, skip },
    };
  }

  async findById(id: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id },
    });
  }

  async create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }
}
