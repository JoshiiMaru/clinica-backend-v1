import { SetMetadata } from '@nestjs/common';

// Este decorador nos permitirá poner @Roles('ADMIN') arriba de nuestras rutas
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);