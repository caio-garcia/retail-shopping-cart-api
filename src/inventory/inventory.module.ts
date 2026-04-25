import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { reservationsStore, productReservationsStore } from './inventory.store';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  providers: [
    {
      provide: 'RESERVATIONS_STORE',
      useValue: reservationsStore,
    },
    {
      provide: 'PRODUCT_RESERVATIONS_STORE',
      useValue: productReservationsStore,
    },
    InventoryService,
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
