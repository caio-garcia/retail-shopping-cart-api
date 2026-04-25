import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { loadSeedData } from './common/data/bootstrap';

async function bootstrap() {
  loadSeedData();

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Retail Shopping Cart API')
    .setDescription(
      'RESTful API for retail shopping cart with product catalog, inventory management, discounts, and checkout',
    )
    .setVersion('1.0')
    .addTag('products', 'Back-office product catalog management')
    .addTag('discounts', 'Back-office discount management')
    .addTag('carts', 'Customer shopping cart operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`✓ Server started at PORT: ${process.env.PORT ?? 3000}`);
  console.log(`✓ API ready: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(
    `✓ Swagger docs: http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
