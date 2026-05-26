import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), ConfigModule],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [PassportModule, JwtStrategy, JwtAuthGuard],
})
export class AuthGuardModule {}
