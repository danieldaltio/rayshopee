import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Called after Supabase Auth signup to provision the user
   * profile and a blank Company in our database.
   */
  async register(dto: RegisterUserDto) {
    // Check if user already exists (idempotent)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create a blank company for the new user
    const company = await this.prisma.company.create({
      data: {
        razao_social: dto.name ? `${dto.name} - Loja` : 'Minha Empresa',
        cnpj: '00000000000000', // Placeholder — will be filled in /configuracoes
      },
    });

    // Create the user linked to the company
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        company_id: company.id,
      },
    });

    return { user, company };
  }
}
