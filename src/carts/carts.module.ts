import { Module } from '@nestjs/common';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { CartTimeoutService } from './cart-timeout.service';
import { cartsStore } from './carts.store';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [ProductsModule, InventoryModule, DiscountsModule],
  controllers: [CartsController],
  providers: [
    {
      provide: 'CARTS_STORE',
      useValue: cartsStore,
    },
    CartsService,
    CartTimeoutService,
  ],
  exports: [CartsService],
})
export class CartsModule {}
