import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('رمز الدخول مفقود');
    }
    const token = header.slice(7);
    try {
      const payload = await this.jwt.verifyAsync(token);
      req.user = {
        userId: payload.sub,
        role: payload.role,
        telegramId: payload.tid,
      };
      return true;
    } catch {
      throw new UnauthorizedException('رمز الدخول غير صالح');
    }
  }
}
