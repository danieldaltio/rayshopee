import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCompanyDto } from './dto/upsert-company.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async findFirst() {
    return this.prisma.company.findFirst({
      orderBy: { created_at: 'asc' },
    });
  }

  async upsert(dto: UpsertCompanyDto) {
    const dataToSave = { ...dto };

    if (dataToSave.certificado_base64) {
      const base64Data = dataToSave.certificado_base64.replace(/^data:.*;base64,/, "");
      const certsDir = path.join(process.cwd(), 'certs');
      
      if (!fs.existsSync(certsDir)) {
        fs.mkdirSync(certsDir, { recursive: true });
      }

      const fileName = `cert_${Date.now()}.pfx`;
      const filePath = path.join(certsDir, fileName);
      
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      
      dataToSave.certificado_digital_url = `/certs/${fileName}`;
      delete dataToSave.certificado_base64;
    }

    const existing = await this.prisma.company.findFirst({
      orderBy: { created_at: 'asc' },
    });

    if (existing) {
      return this.prisma.company.update({
        where: { id: existing.id },
        data: dataToSave,
      });
    }

    return this.prisma.company.create({ data: dataToSave });
  }
}
