import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server started at PORT: ${process.env.PORT ?? 3000}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
