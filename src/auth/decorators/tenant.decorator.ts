import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Este decorador extraerá automáticamente el ID de la especialidad para usarlo en los controladores
export const EspecialidadActiva = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-especialidad-id'] || null;
  },
);