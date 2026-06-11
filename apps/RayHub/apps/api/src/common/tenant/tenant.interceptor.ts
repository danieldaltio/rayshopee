import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantContext } from './tenant.context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const companyId = request.user?.company_id || null;

    // Wrap the entire request lifecycle inside the ALS context
    return tenantContext.run({ companyId }, () => {
      return next.handle();
    });
  }
}
