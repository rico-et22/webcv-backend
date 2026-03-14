import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface SupabaseJwtPayload {
  sub: string;
  email: string;
  role: string;
  aud: string;
  exp: number;
  iat: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly jwksClient: jwksRsa.JwksClient;

  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {
    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
    this.jwksClient = jwksRsa({
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600_000, // 10 minutes
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const payload = await this.verifyToken(token);
      request['user'] = payload;
    } catch (err) {
      this.logger.warn(`JWT verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private verifyToken(token: string): Promise<SupabaseJwtPayload> {
    return new Promise((resolve, reject) => {
      // Decode header to get kid for JWKS lookup
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        return reject(new Error('Could not decode token'));
      }

      const kid = decoded.header.kid as string | undefined;

      const getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
        if (!header.kid) {
          return callback(new Error('No kid in token header'));
        }
        this.jwksClient.getSigningKey(header.kid, (err, key) => {
          if (err) return callback(err);
          callback(null, key?.getPublicKey());
        });
      };

      jwt.verify(
        token,
        kid ? getKey : (() => { throw new Error('Missing kid'); }),
        { algorithms: ['ES256', 'RS256'] },
        (err, payload) => {
          if (err) return reject(err);
          resolve(payload as SupabaseJwtPayload);
        },
      );
    });
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
