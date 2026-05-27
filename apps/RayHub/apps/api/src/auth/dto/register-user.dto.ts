import { IsString, IsEmail, IsOptional } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  supabase_uid: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}
