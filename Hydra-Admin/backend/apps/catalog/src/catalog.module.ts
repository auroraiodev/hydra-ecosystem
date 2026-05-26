import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@hydra/database';
import {
  AppCacheModule,
  ThrottleModule,
  ResponseInterceptor,
  ErrorInterceptor,
  ApiVersioningMiddleware,
} from '@hydra/common';
import { QueueModule } from '@hydra/queue';
import { AuthGuardModule, JwtAuthGuard } from '@hydra/auth';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ConditionsModule } from './conditions/conditions.module.js';
import { LanguagesModule } from './languages/languages.module.js';
import { TagsModule } from './tags/tags.module.js';
import { TcgsModule } from './tcgs/tcgs.module.js';
import { ImportationModule } from './importation/importation.module.js';
import { SearchModule } from './search/search.module.js';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.join(process.cwd(), '.env'),
    }),
    ScheduleModule.forRoot(),
    ThrottleModule,
    AppCacheModule,
    QueueModule,
    PrismaModule,
    AuthGuardModule,
    ProductsModule,
    CategoriesModule,
    ConditionsModule,
    LanguagesModule,
    TagsModule,
    TcgsModule,
    ImportationModule,
    SearchModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class CatalogModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiVersioningMiddleware).forRoutes('*');
  }
}
