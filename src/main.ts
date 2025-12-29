import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import mongoose from 'mongoose';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.enableCors();

  app.useLogger(app.get(Logger));

  const logger = app.get(Logger);

  mongoose.connection.on('connected', () => {
    logger.log('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  await app.listen(process.env.PORT || 8080, '0.0.0.0');
}
bootstrap();
