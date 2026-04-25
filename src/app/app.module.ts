import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { CartsModule } from '../carts/carts.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ProductsModule,
    InventoryModule,
    DiscountsModule,
    CartsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
