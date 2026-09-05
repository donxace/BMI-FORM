import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/*
 * Marks a controller or route handler as restricted to specific admin
 * roles. Read by AdminAuthGuard via Reflector. Routes/controllers using
 * AdminAuthGuard without this decorator accept any authenticated admin
 * account (the legacy 'admin' super-role always passes regardless).
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
