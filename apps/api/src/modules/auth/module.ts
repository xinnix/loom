import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

// 控制器
import { AuthController } from './rest/auth.controller';

// 服务
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './services/jwt.strategy';

// 模块
import { WechatModule } from '../wechat/wechat.module';

const JWT_SECRET_FALLBACK = 'your-super-secret-jwt-key-change-in-production';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // secret 必须运行时求值：装饰器求值早于 ConfigModule 加载 .env，
    // 若在此直接读 process.env 会拿到 fallback，与 JwtStrategy（DI 时读 env）不一致，
    // 导致签发与验证 secret 不同（invalid signature）。
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || JWT_SECRET_FALLBACK,
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '1h') as any,
        },
      }),
      global: true,
    }),
    WechatModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AuthService,
      useClass: AuthService,
    },
    JwtStrategy,
  ],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
