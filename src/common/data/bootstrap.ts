import { seedProducts, seedDiscounts } from './seed';
import { productsStore } from '../../products/products.store';
import { discountsStore } from '../../discounts/discounts.store';

export function loadSeedData(): void {
  productsStore.clear();
  discountsStore.clear();

  seedProducts.forEach((product) => {
    productsStore.set(product.id, product);
  });

  seedDiscounts.forEach((discount) => {
    discountsStore.set(discount.id, discount);
  });

  console.log(
    `✓ Seed data loaded: ${productsStore.size} products, ${discountsStore.size} discounts`,
  );
}
