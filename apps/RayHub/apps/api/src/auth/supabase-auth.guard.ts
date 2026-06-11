/**
 * AuthGuard — Supabase JWT Verification para NestJS
 * 
 * Verifica o token JWT do Supabase no header Authorization.
 * Rotas decoradas com @UseGuards(SupabaseAuthGuard) requerem autenticação.
 * Rotas decoradas com @Public() são isentas.
 * 
 * O token é verificado usando a chave pública do Supabase (JWKS).
 * Para simplicidade nesta versão, usamos a SUPABASE_SERVICE_ROLE_KEY
 * para decodificar o JWT via a biblioteca padrão do Supabase.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

/** Decorator para marcar rotas como públicas (sem autenticação) */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly supabaseUrl: string;
  private readonly supabaseServiceKey: string;

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      console.warn(
        '[SupabaseAuthGuard] ATENÇÃO: Variáveis NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY não estão definidas. ' +
        'O guard permitirá todas as requisições em modo de desenvolvimento.',
      );
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verifica se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Se as chaves do Supabase não estão configuradas, permite em dev
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      console.warn('[SupabaseAuthGuard] Supabase não configurado — permitindo em modo dev.');
      return true;
    }

    // 3. Extrai o token do header Authorization
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token de autenticação não fornecido. Envie o header Authorization: Bearer <token>');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      throw new UnauthorizedException('Token de autenticação vazio.');
    }

    // 4. Verifica o token com o Supabase
    try {
      const supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);

      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data?.user) {
        throw new UnauthorizedException(
          `Token inválido ou expirado: ${error?.message || 'Usuário não encontrado'}`,
        );
      }

      // Busca o usuário no banco local para pegar o company_id e a role real
      const localUser = await this.prisma.user.findUnique({
        where: { email: data.user.email },
      });

      // 5. Injeta o usuário autenticado na request
      request.user = {
        id: data.user.id,
        email: data.user.email,
        role: localUser?.role || 'OPERATOR',
        company_id: localUser?.company_id || null,
        metadata: data.user.user_metadata,
      };

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('[SupabaseAuthGuard] Erro ao verificar token:', err);
      throw new UnauthorizedException('Falha na verificação do token.');
    }
  }
}
