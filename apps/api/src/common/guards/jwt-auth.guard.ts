import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
    _context: ExecutionContext,
  ): TUser {
    if (err) {
      throw err;
    }

    if (!user) {
      const message = info?.message || 'Authentication required';
      throw new UnauthorizedException(
        `Access denied: ${message}. Please provide a valid access token.`,
      );
    }

    return user;
  }
}
