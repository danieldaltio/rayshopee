"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthGuard = exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const supabase_js_1 = require("@supabase/supabase-js");
const prisma_service_1 = require("../prisma/prisma.service");
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
let SupabaseAuthGuard = class SupabaseAuthGuard {
    reflector;
    prisma;
    supabaseUrl;
    supabaseServiceKey;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
        this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        if (!this.supabaseUrl || !this.supabaseServiceKey) {
            console.warn('[SupabaseAuthGuard] ATENÇÃO: Variáveis NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY não estão definidas. ' +
                'O guard permitirá todas as requisições em modo de desenvolvimento.');
        }
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(exports.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        if (!this.supabaseUrl || !this.supabaseServiceKey) {
            console.warn('[SupabaseAuthGuard] Supabase não configurado — permitindo em modo dev.');
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            throw new common_1.UnauthorizedException('Token de autenticação não fornecido. Envie o header Authorization: Bearer <token>');
        }
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token) {
            throw new common_1.UnauthorizedException('Token de autenticação vazio.');
        }
        try {
            const supabase = (0, supabase_js_1.createClient)(this.supabaseUrl, this.supabaseServiceKey);
            const { data, error } = await supabase.auth.getUser(token);
            if (error || !data?.user) {
                throw new common_1.UnauthorizedException(`Token inválido ou expirado: ${error?.message || 'Usuário não encontrado'}`);
            }
            const localUser = await this.prisma.user.findUnique({
                where: { email: data.user.email },
            });
            request.user = {
                id: data.user.id,
                email: data.user.email,
                role: localUser?.role || 'OPERATOR',
                company_id: localUser?.company_id || null,
                metadata: data.user.user_metadata,
            };
            return true;
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException)
                throw err;
            console.error('[SupabaseAuthGuard] Erro ao verificar token:', err);
            throw new common_1.UnauthorizedException('Falha na verificação do token.');
        }
    }
};
exports.SupabaseAuthGuard = SupabaseAuthGuard;
exports.SupabaseAuthGuard = SupabaseAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], SupabaseAuthGuard);
//# sourceMappingURL=supabase-auth.guard.js.map