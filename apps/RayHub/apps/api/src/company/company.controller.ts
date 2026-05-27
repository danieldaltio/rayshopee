import { Controller, Get, Put, Body } from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpsertCompanyDto } from './dto/upsert-company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  findOne() {
    return this.companyService.findFirst();
  }

  @Put()
  upsert(@Body() dto: UpsertCompanyDto) {
    return this.companyService.upsert(dto);
  }
}
