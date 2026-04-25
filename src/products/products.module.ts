import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { productsStore } from './products.store';

@Module({
  controllers: [ProductsController],
  providers: [
    {
      provide: 'PRODUCTS_STORE',
      useValue: productsStore,
    },
    ProductsService,
  ],
  exports: [ProductsService, 'PRODUCTS_STORE'],
})
export class ProductsModule {}
