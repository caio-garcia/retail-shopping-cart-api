# Retail Shopping Cart API - Solution

## Overview

This is a fully functional RESTful API for a retail shopping cart system built with NestJS and TypeScript, following a **functional programming approach**. The system handles product catalogue management, inventory with stock reservations, discount calculation, and checkout processing with support for concurrent customer sessions.

## Architecture

### Functional Programming Approach

This implementation follows functional programming principles within the NestJS framework:

- **Stateless Services**: All service methods are pure functions with no instance state
- **Modular Storage**: Data persistence separated into dedicated `.store.ts` files with singleton Maps
- **Pure Functions**: Business logic (discount engine, timeout detection) implemented as pure, testable functions
- **Immutable Operations**: Services work with data transformations rather than mutations
- **Type Safety**: Zod schemas provide runtime validation and TypeScript type inference

### Module Structure

```
src/
├── common/
│   ├── data/
│   │   ├── seed.ts              # Default products and discounts
│   │   └── bootstrap.ts         # Seed data loader
│   ├── interfaces/              # TypeScript interfaces
│   │   ├── product.interface.ts
│   │   ├── cart.interface.ts
│   │   ├── discount.interface.ts
│   │   └── reservation.interface.ts
│   ├── exceptions/              # Custom exception classes
│   └── pipes/
│       └── zod-validation.pipe.ts
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   ├── products.service.ts      # Stateless with pure functions
│   ├── products.store.ts        # Singleton Map storage
│   └── schemas/
│       └── product.schema.ts    # Zod validation schemas
├── inventory/
│   ├── inventory.module.ts
│   ├── inventory.service.ts     # Stock reservation logic
│   └── inventory.store.ts       # Reservation storage
├── discounts/
│   ├── discounts.module.ts
│   ├── discounts.controller.ts
│   ├── discounts.service.ts
│   ├── discounts.store.ts
│   ├── discount-engine.ts       # Pure discount calculation function
│   └── schemas/
│       └── discount.schema.ts
├── carts/
│   ├── carts.module.ts
│   ├── carts.controller.ts
│   ├── carts.service.ts
│   ├── carts.store.ts
│   ├── cart-timeout.service.ts  # Scheduled cleanup
│   └── schemas/
│       └── cart.schema.ts
└── app/
    ├── app.module.ts            # Root module with ScheduleModule
    └── ...
```

### Data Flow

1. **Customer Journey**:
   - Create cart → Add items (reserves stock) → Update/Remove items → Checkout (commits stock, applies discounts)

2. **Stock Management**:
   - Product stock tracked separately from reserved stock
   - Available stock = Total stock - Reserved stock
   - Reservations released on cart expiry or item removal
   - Stock deducted only on successful checkout

3. **Discount Application** (Precedence Order):
   - BUY_X_GET_Y (e.g., "Buy 2 Get 1 Free")
   - BULK_PRICING (e.g., "Buy 5+ get 20% off")
   - PERCENTAGE_OFF (e.g., "10% off everything")
   - FIXED_AMOUNT_OFF (e.g., "$50 off")

## How to Run

### Prerequisites

- Node.js (v22.22.2 or compatible)
- npm (v10.7.0 or compatible)

### Installation

```bash
npm install
```

### Start the Application

```bash
# Development mode with hot reload
npm run start:dev

# Standard mode (used for submission)
npm start

# Production mode
npm run start:prod
```

The server will start at `http://localhost:3000` and automatically load seed data (7 products, 4 discounts).

### Verify Seed Data Loaded

```bash
curl http://localhost:3000/products
curl http://localhost:3000/discounts
```

## How to Test

### Run All Tests

```bash
# Run all tests (unit + E2E)
npm test

# Run with coverage
npm run test:cov

# Run only unit tests
npm test -- --testPathPattern=spec.ts$

# Run only E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

### Test Coverage

The test suite includes:

- **Unit Tests** (6 test suites):
  - `products.service.spec.ts` - Product CRUD operations
  - `inventory.service.spec.ts` - Stock reservations with concurrency tests
  - `discounts.service.spec.ts` - Discount CRUD operations
  - `discount-engine.spec.ts` - Discount calculation logic (all 4 types)
  - `carts.service.spec.ts` - Cart operations and checkout
  - `cart-timeout.service.spec.ts` - Timeout detection and cleanup

- **E2E Tests** (4 test suites):
  - `products.e2e-spec.ts` - Products API endpoints
  - `discounts.e2e-spec.ts` - Discounts API endpoints
  - `carts.e2e-spec.ts` - Cart management endpoints
  - `checkout.e2e-spec.ts` - Checkout scenarios and concurrency

Expected output: All tests pass with >80% code coverage.

## API Endpoints

### Products API (Back-office operations)

#### List Products

```bash
GET /products
GET /products?search=laptop

curl http://localhost:3000/products
```

#### Get Product

```bash
GET /products/:id

curl http://localhost:3000/products/prod-laptop-001
```

#### Create Product

```bash
POST /products
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "price": 9999,
  "stock": 100
}

curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Gaming Mouse","description":"RGB gaming mouse","price":4999,"stock":25}'
```

#### Update Product

```bash
PUT /products/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 12999
}

curl -X PUT http://localhost:3000/products/prod-laptop-001 \
  -H "Content-Type: application/json" \
  -d '{"name":"Premium Laptop Pro","price":139900}'
```

#### Adjust Stock

```bash
PATCH /products/:id/stock
Content-Type: application/json

{
  "stock": 50
}

curl -X PATCH http://localhost:3000/products/prod-mouse-001/stock \
  -H "Content-Type: application/json" \
  -d '{"stock":100}'
```

### Discounts API (Back-office operations)

#### List Discounts

```bash
GET /discounts
GET /discounts?activeOnly=true

curl http://localhost:3000/discounts?activeOnly=true
```

#### Get Discount

```bash
GET /discounts/:id

curl http://localhost:3000/discounts/disc-percentage-001
```

#### Create Discount

```bash
POST /discounts
Content-Type: application/json

# Percentage Off
{
  "name": "20% Off Sale",
  "description": "Get 20% off your entire purchase",
  "type": "PERCENTAGE_OFF",
  "isActive": true,
  "rules": {
    "percentage": 20
  }
}

# Buy X Get Y
{
  "name": "Buy 3 Get 1 Free",
  "description": "Buy 3 keyboards, get 1 free",
  "type": "BUY_X_GET_Y",
  "isActive": true,
  "rules": {
    "buyQuantity": 3,
    "getQuantity": 1,
    "productId": "prod-keyboard-001"
  }
}

curl -X POST http://localhost:3000/discounts \
  -H "Content-Type: application/json" \
  -d '{"name":"15% Off","description":"Summer sale","type":"PERCENTAGE_OFF","isActive":true,"rules":{"percentage":15}}'
```

#### Update Discount

```bash
PUT /discounts/:id
Content-Type: application/json

{
  "isActive": false
}

curl -X PUT http://localhost:3000/discounts/disc-percentage-001 \
  -H "Content-Type: application/json" \
  -d '{"isActive":false}'
```

### Carts API (Customer operations)

#### Create Cart

```bash
POST /carts

curl -X POST http://localhost:3000/carts
```

#### Get Cart (with totals and discounts)

```bash
GET /carts/:id

curl http://localhost:3000/carts/YOUR_CART_ID
```

#### Add Item to Cart

```bash
POST /carts/:id/items
Content-Type: application/json

{
  "productId": "prod-laptop-001",
  "quantity": 1
}

curl -X POST http://localhost:3000/carts/YOUR_CART_ID/items \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod-laptop-001","quantity":1}'
```

#### Update Item Quantity

```bash
PUT /carts/:id/items/:productId
Content-Type: application/json

{
  "quantity": 3
}

curl -X PUT http://localhost:3000/carts/YOUR_CART_ID/items/prod-laptop-001 \
  -H "Content-Type: application/json" \
  -d '{"quantity":3}'
```

#### Remove Item

```bash
DELETE /carts/:id/items/:productId

curl -X DELETE http://localhost:3000/carts/YOUR_CART_ID/items/prod-laptop-001
```

#### Checkout

```bash
POST /carts/:id/checkout

curl -X POST http://localhost:3000/carts/YOUR_CART_ID/checkout
```

## Complete Customer Journey Example

```bash
# 1. Create a new cart
CART_ID=$(curl -s -X POST http://localhost:3000/carts | jq -r '.id')
echo "Cart ID: $CART_ID"

# 2. Add a laptop to cart
curl -X POST http://localhost:3000/carts/$CART_ID/items \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod-laptop-001","quantity":1}'

# 3. Add 3 mice (qualifies for Buy 2 Get 1 Free)
curl -X POST http://localhost:3000/carts/$CART_ID/items \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod-mouse-001","quantity":3}'

# 4. View cart with calculated totals and discounts
curl http://localhost:3000/carts/$CART_ID

# 5. Checkout
curl -X POST http://localhost:3000/carts/$CART_ID/checkout

# 6. Verify stock was deducted
curl http://localhost:3000/products/prod-laptop-001
curl http://localhost:3000/products/prod-mouse-001
```

## Discount Engine

### Supported Discount Types

#### 1. PERCENTAGE_OFF

Applies a percentage discount to the entire cart total.

**Example**: 10% off everything

```json
{
  "type": "PERCENTAGE_OFF",
  "rules": {
    "percentage": 10
  }
}
```

**Calculation**: `discount = currentTotal × (percentage / 100)`

#### 2. FIXED_AMOUNT_OFF

Applies a fixed dollar amount discount to the cart total.

**Example**: $50 off

```json
{
  "type": "FIXED_AMOUNT_OFF",
  "rules": {
    "amount": 5000
  }
}
```

**Calculation**: `discount = min(amount, currentTotal)`

#### 3. BUY_X_GET_Y

Buy X items of a specific product, get Y items free.

**Example**: Buy 2 Get 1 Free

```json
{
  "type": "BUY_X_GET_Y",
  "rules": {
    "buyQuantity": 2,
    "getQuantity": 1,
    "productId": "prod-mouse-001"
  }
}
```

**Calculation**: `freeItems = floor(quantity / (buy + get)) × get`
**Discount**: `freeItems × itemPrice`

#### 4. BULK_PRICING

Apply percentage discount when buying minimum quantity of a product.

**Example**: Buy 5+ cables, get 20% off those cables

```json
{
  "type": "BULK_PRICING",
  "rules": {
    "minQuantity": 5,
    "discountPercentage": 20,
    "applicableProductId": "prod-cable-001"
  }
}
```

**Calculation**: If `quantity >= minQuantity`, apply `discountPercentage` to product total

### Discount Precedence

Discounts are applied in the following order to prevent stacking issues:

1. **BUY_X_GET_Y** - Applied first (specific product deals)
2. **BULK_PRICING** - Applied second (volume discounts)
3. **PERCENTAGE_OFF** - Applied third (cart-wide percentage)
4. **FIXED_AMOUNT_OFF** - Applied last (cart-wide fixed amount)

Each discount is calculated against the running total after previous discounts.

### Example Discount Calculation

**Cart**: 1 × Laptop ($1,299.00)

**Active Discounts**:

- 10% Off Everything
- $50 Off

**Calculation**:

1. Subtotal: $1,299.00
2. Apply 10% Off: $1,299.00 - $129.90 = $1,169.10
3. Apply $50 Off: $1,169.10 - $50.00 = $1,119.10
4. **Final Total: $1,119.10**

## Stock Reservation System

### How It Works

1. **When item added to cart**: Stock is immediately reserved (not deducted)
   - Available stock = Total stock - Reserved stock
   - Other customers see reduced available stock
   - Actual product stock unchanged

2. **When item removed or cart expires**: Reservation is released
   - Stock becomes available again
   - No change to product stock

3. **When checkout succeeds**: Reservations are committed
   - Product stock is deducted
   - Reservations are deleted

4. **Concurrency handling**:
   - Two customers competing for last 3 items:
     - Customer A adds 2 to cart → 1 available for Customer B
     - Customer B can only add 1 to cart
     - Customer C gets "Insufficient stock" error

### Cart Timeout

Inactive carts are automatically expired after **2 minutes** of inactivity:

- **Inactivity**: No cart operations (add/update/remove items) for 2 minutes
- **Cleanup**: Scheduled task runs every minute via `@Cron`
- **Process**:
  1. Find carts with `lastActivityAt > 2 minutes ago`
  2. Release all stock reservations
  3. Mark cart status as `EXPIRED`
  4. Expired carts cannot be modified or checked out

**Test it**:

```bash
# Create cart and add items
CART_ID=$(curl -s -X POST http://localhost:3000/carts | jq -r '.id')
curl -X POST http://localhost:3000/carts/$CART_ID/items \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod-laptop-001","quantity":2}'

# Check available stock (should be 8 if starting stock was 10)
curl http://localhost:3000/products/prod-laptop-001

# Wait 2+ minutes...

# Check available stock again (should be back to 10)
curl http://localhost:3000/products/prod-laptop-001

# Try to checkout (should fail with cart expired)
curl -X POST http://localhost:3000/carts/$CART_ID/checkout
```

## Seed Data

The application loads default data on startup from `src/common/data/seed.ts`:

### Products (7 items)

- Premium Laptop - $1,299.00 (10 in stock)
- Wireless Mouse - $35.00 (50 in stock)
- Mechanical Keyboard - $89.00 (25 in stock)
- 27" 4K Monitor - $459.00 (8 in stock)
- Wireless Headset - $129.00 (30 in stock)
- HD Webcam - $69.00 (20 in stock)
- USB-C Cable - $15.00 (100 in stock)

### Discounts (4 active)

- 10% Off Everything (PERCENTAGE_OFF)
- Buy 2 Get 1 Free - Mouse (BUY_X_GET_Y)
- Bulk Cable Discount - 5+ cables get 20% off (BULK_PRICING)
- $50 Off (FIXED_AMOUNT_OFF)

Seed data ensures reviewers can immediately test the API without creating products/discounts first.

## Validation

Input validation uses **Zod schemas** for type-safe, functional validation:

- Products: Price must be positive, stock must be ≥ 0
- Discounts: Type-specific rules validation
- Carts: Product ID required, quantity must be positive
- Automatic validation via `ZodValidationPipe`
- Returns 400 with detailed error messages on validation failure

## Error Handling

Custom exceptions provide clear, actionable error messages:

- `ProductNotFoundException` (404): "Product with ID {id} not found"
- `CartNotFoundException` (404): "Cart with ID {id} not found"
- `DiscountNotFoundException` (404): "Discount with ID {id} not found"
- `InsufficientStockException` (400): "Insufficient stock for {product}. Available: X, Requested: Y"
- `InvalidOperationException` (400): Context-specific error (e.g., "Cannot checkout empty cart")

## Assumptions

1. **Single-Process Deployment**: No distributed system complexity; single Node.js process
2. **No Authentication**: All endpoints are public (as per requirements)
3. **In-Memory Storage**: Data persists only while application is running
4. **Price in Cents**: All prices stored as integers (e.g., 9999 = $99.99) to avoid floating-point precision issues
5. **UUID Identifiers**: All entities use UUIDs for unique identification
6. **Cart Inactivity**: Measured from last operation timestamp; any cart API call resets timer
7. **Discount Precedence**: Fixed order (BUY_X_GET_Y → BULK_PRICING → PERCENTAGE_OFF → FIXED_AMOUNT_OFF)
8. **Stock Validation**: Synchronous checks acceptable for single-process in-memory system
9. **Immutable Completed Carts**: Once checked out or expired, cart cannot be modified
10. **Price Snapshot**: Product prices captured at time of adding to cart; price changes don't affect existing cart items
11. **Positive Stock Only**: Stock levels cannot go negative (validated at reservation time)
12. **Scheduler Interval**: Cart timeout check runs every minute (1-minute granularity)

## Design Decisions

### Functional Programming Approach

**Why**: Easier to test, reason about, and maintain. Pure functions with no side effects reduce bugs and improve composability.

**Implementation**:

- Services inject storage Maps but don't hold state
- Business logic in pure functions (e.g., `applyDiscounts`, `findInactiveCarts`)
- Data transformations instead of mutations

### Zod over Class-Validator

**Why**: More functional, better TypeScript inference, single source of truth for types and validation.

**Benefits**:

- Type-safe: `z.infer<typeof schema>` generates TypeScript types
- Composable: Schemas can be combined and reused
- Runtime safety: Validates at runtime, catches issues early

### Modular Storage Pattern

**Why**: Separates data persistence from business logic, makes testing easier, could swap implementations.

**Structure**:

- Each domain has its own `.store.ts` file
- Services inject stores via DI
- Easy to replace with real database later

### Immediate Stock Reservation

**Why**: Provides better UX and prevents overselling in concurrent scenarios.

**Alternative**: Pessimistic (validate only at checkout) - easier but leads to checkout failures and poor customer experience.

### Scheduler-Based Cart Timeout

**Why**: Simple, predictable, centralized cleanup logic.

**Alternative**: Per-cart timers - more complex, harder to test, potential memory leaks.

### Discount Precedence Order

**Why**: Prevents unexpected discount stacking, provides predictable pricing.

**Order Rationale**:

- Product-specific deals first (BOGO, bulk)
- Cart-wide discounts last (percentage, fixed)
- Percentage before fixed (avoids percentage of already-reduced amount)

## Testing Strategy

### Unit Tests

- Test pure functions in isolation
- Mock dependencies (stores, services)
- Focus on business logic correctness
- Fast execution, no external dependencies

### E2E Tests

- Test complete request/response cycles
- Use seed data in test environment
- Cover happy paths and error scenarios
- Validate integration between modules

### Coverage Goals

- > 80% code coverage
- All critical paths covered (checkout, stock management, discounts)
- Edge cases tested (concurrent carts, insufficient stock, expired carts)

## Future Enhancements

If this were a production system, consider:

1. **Database Integration**: Replace in-memory Maps with PostgreSQL/MongoDB
2. **Authentication**: JWT-based auth with role-based access control
3. **Rate Limiting**: Prevent abuse of cart creation/reservation
4. **Cart Persistence**: Save carts across sessions (logged-in users)
5. **Payment Integration**: Connect to Stripe/PayPal for real transactions
6. **Webhooks**: Notify external systems on checkout events
7. **Metrics**: Track cart abandonment, popular products, discount effectiveness
8. **Search**: Advanced product search with filters (category, price range)
9. **Admin Dashboard**: UI for managing products, discounts, viewing analytics
10. **Distributed Locking**: For multi-instance deployments (Redis locks)

## Conclusion

This solution demonstrates:

✅ **Functional programming** within NestJS framework
✅ **Modular architecture** with clear separation of concerns
✅ **Type-safe validation** with Zod schemas
✅ **Stock management** with concurrent reservation system
✅ **Flexible discount engine** with 4 discount types
✅ **Automated cart timeout** with scheduled cleanup
✅ **Comprehensive testing** (unit + E2E) with >80% coverage
✅ **Production-ready patterns** (error handling, validation, logging)

The implementation satisfies all acceptance criteria:

- Back-office can manage products and discounts ✓
- Customers can browse, cart, and checkout ✓
- Checkout updates stock levels ✓
- Insufficient stock blocks checkout ✓
- Multiple concurrent carts supported ✓
- Inactive carts auto-expire after 2 minutes ✓

Ready for review and testing!
