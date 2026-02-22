import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      credentials: true,
      preflightContinue: false,
    });

    // helpful startup logging
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`✓ Server running on http://localhost:${port}`);
    console.log('✓ CORS enabled (origin: *) with JSON support');
    console.log('✓ Database synchronized and connected');
  } catch (error) {
    console.error('✗ Failed to start server:', error?.message ?? error);
    process.exit(1);
  }
}

bootstrap();
