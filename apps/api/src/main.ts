import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@presentation/filters/all-exceptions.filter';
import { TransformInterceptor } from '@presentation/filters/transform.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api/v1'); // ترقيم إصدارات API

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('بيسان التعليمية API')
    .setDescription('واجهة برمجة منصة بيسان — تواصل المعلم والطالب')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, doc);

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  Logger.log(`بيسان API يعمل على المنفذ ${port}`, 'Bootstrap');
}
void bootstrap();
