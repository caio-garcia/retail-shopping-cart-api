import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { discountsStore } from './discounts.store';

@Module({
  controllers: [DiscountsController],
  providers: [
    {
      provide: 'DISCOUNTS_STORE',
      useValue: discountsStore,
    },
    DiscountsService,
  ],
  exports: [DiscountsService],
})
export class DiscountsModule {}
