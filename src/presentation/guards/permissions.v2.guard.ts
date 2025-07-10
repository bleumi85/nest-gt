import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from './jwt-auth.guard';
import { PERMISSIONS_KEY } from '@shared/decorators/permissions.decorator';

@Injectable()
export class PermissionsV2Guard extends JwtAuthGuard implements CanActivate {
  private guardReflector: Reflector;

  constructor(reflector: Reflector) {
    super(reflector);
    this.guardReflector = reflector;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.guardReflector.getAllAndMerge<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permission requirements, allow access
    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check permissions if required
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = user.permissions || [];
      const hasRequiredPermission = requiredPermissions.some(permission =>
        userPermissions.includes(permission),
      );

      if (!hasRequiredPermission) {
        throw new ForbiddenException(
          `User does not have required permissions: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }
}
