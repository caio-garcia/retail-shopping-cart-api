# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Retail Shopping Cart API** is a RESTful API for a retail shopping cart system built with NestJS and TypeScript. It follows a **functional programming approach** with stateless services and modular storage. The system handles product catalog management, inventory with stock reservations, discount calculation, and checkout processing with support for concurrent customer sessions.

## Development Commands

### Build & Development

```bash
# Build the application
npm run build

# Start in development mode with hot reload
npm run start:dev

# Start in debug mode
npm run start:debug

# Start production build
npm run start:prod
```

### Testing

```bash
# Run all tests (unit + e2e)
npm test

# Run only unit tests
npm test -- --testPathPattern=spec.ts$

# Run only e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Debug tests
npm run test:debug
```

### Linting & Formatting

```bash
# Lint code
npm run lint

# Lint and auto-fix
npm run lint:fix

# Format code with Prettier
npm run format
```

### Git Workflow

- Husky manages git hooks via `npm run prepare`
- Commits should follow best practices for clear history
- Run tests before committing significant changes

## Architecture

### Core Concepts

The application follows a **functional programming approach** within the NestJS framework:

1. **Stateless Services** - All service methods are pure functions with no instance state
   - Services receive dependencies via constructor injection
   - No class-level state variables (except injected dependencies)
   - All data modifications go through store Maps

2. **Modular Storage** - Data persistence separated into dedicated `.store.ts` files
   - Each module has a singleton Map for data storage
   - Stores exported as providers with `'MODULE_NAME_STORE'` tokens
   - Examples: `PRODUCTS_STORE`, `CARTS_STORE`, `INVENTORY_STORE`, `DISCOUNTS_STORE`

3. **Pure Business Logic** - Core algorithms implemented as standalone pure functions
   - `discount-engine.ts` - Pure discount calculation function
   - `cart-timeout.service.ts` - Stateless timeout detection
   - Easy to test in isolation without mocking

4. **Type Safety** - Zod schemas provide runtime validation and TypeScript type inference
   - Schemas define request/response shapes
   - `z.infer<>` generates TypeScript types from schemas
   - Validation happens at controller level via custom pipes

5. **Atomic Operations** - Services implement rollback mechanisms for data consistency
   - Stock reservations released if cart operations fail
   - All-or-nothing approach for multi-step operations

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
│   │   └── index.ts             # ProductNotFoundException, CartNotFoundException, etc.
│   ├── pipes/
│   │   └── zod-validation.pipe.ts
│   └── utils/
│       └── uuid.ts              # ID generation
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts   # REST endpoints for back-office
│   ├── products.service.ts      # Stateless CRUD operations
│   ├── products.store.ts        # Map<string, Product>
│   └── schemas/
│       └── product.schema.ts    # Zod validation schemas
├── inventory/
│   ├── inventory.module.ts
│   ├── inventory.service.ts     # Stock reservation/release logic
│   └── inventory.store.ts       # Map<string, Reservation[]>
├── discounts/
│   ├── discounts.module.ts
│   ├── discounts.controller.ts  # REST endpoints for back-office
│   ├── discounts.service.ts     # Stateless CRUD operations
│   ├── discounts.store.ts       # Map<string, Discount>
│   ├── discount-engine.ts       # Pure discount calculation function
│   └── schemas/
│       └── discount.schema.ts   # Zod schemas for 4 discount types
├── carts/
│   ├── carts.module.ts
│   ├── carts.controller.ts      # REST endpoints for customers
│   ├── carts.service.ts         # Cart operations with atomic rollback
│   ├── carts.store.ts           # Map<string, Cart>
│   ├── cart-timeout.service.ts  # Scheduled cleanup with @Cron
│   └── schemas/
│       └── cart.schema.ts       # Zod validation schemas
└── app/
    ├── app.module.ts            # Root module, imports ScheduleModule
    ├── app.controller.ts
    └── app.service.ts
```

### Data Flow

1. **Customer Journey**:

   ```
   POST /carts → Add items (reserves stock) → Update/Remove items → POST /carts/:id/checkout
   ```

   - Creating cart with initial items is optional
   - Each item addition reserves stock from inventory
   - Checkout commits stock deductions and applies discounts
   - Failed operations trigger automatic rollback

2. **Stock Management**:

   ```
   Available Stock = Total Stock - Reserved Stock
   ```

   - Product stock tracked in `products.store.ts`
   - Reservations tracked per cart in `inventory.store.ts`
   - `reserveStock()` validates availability before reserving
   - `releaseCartReservations()` releases all reservations for a cart
   - `commitCartReservations()` deducts stock on checkout

3. **Discount Application** (Precedence Order):
   1. `BUY_X_GET_Y` - e.g., "Buy 2 Get 1 Free" on specific product
   2. `BULK_PRICING` - e.g., "Buy 5+ get 20% off" on specific product
   3. `PERCENTAGE_OFF` - e.g., "10% off everything"
   4. `FIXED_AMOUNT_OFF` - e.g., "$50 off total"

4. **Cart Timeout**:
   - Cron job runs every 5 minutes via `@nestjs/schedule`
   - Detects carts inactive for >30 minutes
   - Releases stock reservations
   - Marks carts as `ABANDONED`

### Key Design Patterns

- **Store Pattern**: Singleton Maps injected via tokens (`'PRODUCTS_STORE'`, etc.)
- **Service Pattern**: Stateless services with pure methods, stores injected as dependencies
- **Schema Pattern**: Zod schemas co-located in `schemas/` folders, types inferred via `z.infer<>`
- **Exception Pattern**: Custom exceptions in `common/exceptions/` for consistent error handling
- **Dependency Injection**: NestJS DI for all services, stores, and cross-module dependencies

## Project Structure

This is a standard NestJS application with the following structure:

- **`src/`** - Application source code
  - `main.ts` - Bootstrap file, loads seed data on startup
  - `app/` - Root module
  - `products/`, `inventory/`, `discounts/`, `carts/` - Feature modules
  - `common/` - Shared utilities, interfaces, exceptions

- **`test/`** - E2E test suites
  - `*.e2e-spec.ts` - Integration tests using supertest
  - `fixtures/mock-data.ts` - Test data fixtures
  - `jest-e2e.json` - E2E test configuration

- **`coverage/`** - Test coverage reports (generated)

- **Configuration Files**:
  - `tsconfig.json` / `tsconfig.build.json` - TypeScript configuration
  - `jest.config.js` - Unit test configuration
  - `eslint.config.mjs` - ESLint configuration
  - `nest-cli.json` - Nest CLI configuration

## Testing

- **Framework**: Jest with ts-jest for both unit and e2e tests
- **Unit Tests**: Co-located with source files as `*.spec.ts`
  - Test stateless service methods with mocked dependencies
  - Pure function testing (discount engine, timeout detection)
  - Focus on business logic and edge cases
- **E2E Tests**: Located in `test/` directory
  - Test complete HTTP request/response cycles
  - Use supertest for HTTP assertions
  - Test concurrent operations and race conditions
  - Verify stock management and discount application
- **Coverage**: Run with `--coverage` flag, target >80% coverage
- **Test Data**:
  - Seed data in `src/common/data/seed.ts`
  - Test fixtures in `test/fixtures/mock-data.ts`

## Important Implementation Notes

1. **Store Injection**: Stores are injected as dependencies using string tokens (e.g., `@Inject('PRODUCTS_STORE')`). Each store is a singleton Map provided in the module's `providers` array.

2. **Atomic Operations**: Services like `CartsService.createCart()` implement try-catch-rollback patterns. If any operation fails during cart creation/modification, all stock reservations are released via `inventoryService.releaseCartReservations()`.

3. **Zod Validation**: Controllers use Zod schemas for validation. Parse errors are caught and transformed into `BadRequestException` with structured error messages. Always use `try-catch` when calling `schema.parse()`.

4. **Stock Reservations**: The inventory system uses a two-phase approach:
   - Phase 1: Reserve stock when items are added to cart (`reserveStock()`)
   - Phase 2: Commit reservations on checkout (`commitCartReservations()`)
   - Rollback: Release reservations on cart timeout or item removal

5. **Discount Engine**: The `applyDiscounts()` function in `discount-engine.ts` is a pure function that takes cart items and discounts as input, returns calculated totals. It applies discounts in a specific precedence order (BUY_X_GET_Y → BULK_PRICING → PERCENTAGE_OFF → FIXED_AMOUNT_OFF).

6. **Scheduled Tasks**: `CartTimeoutService` uses `@Cron()` decorator from `@nestjs/schedule` to run periodic cleanup. The service detects abandoned carts and releases their stock reservations.

7. **Price Storage**: All prices are stored as integers representing cents (e.g., $129.99 = 12999). This avoids floating-point precision issues.

8. **Empty Body Handling**: When creating carts with optional initial items, controllers must explicitly check for empty/undefined bodies before validation to avoid 400 errors on empty POST requests.

9. **Error Handling**: Use custom exceptions from `common/exceptions/` for consistent error responses:
   - `ProductNotFoundException` - Product not found (404)
   - `CartNotFoundException` - Cart not found (404)
   - `InsufficientStockException` - Not enough stock (400)
   - `InvalidOperationException` - Invalid state transition (400)

## Coding Principles

### Comments Philosophy

**If code needs "how" or "what" comments to be understood, it's a sign the code needs refactoring.**

Guidelines:

- ✅ **Self-documenting code** - Use clear naming, proper abstractions, and logical structure
- ✅ **"Why" comments only** - Explain non-obvious decisions, constraints, or trade-offs
- ❌ **No "how" comments** - Don't explain step-by-step what the code does
- ❌ **No "what" comments** - Don't describe what a function/variable is (the name should do that)
- 🔧 **Refactor unclear code** - If you need to explain how/what, refactor instead

Examples:

```typescript
// ❌ BAD - "what" comment
// This function gets the user by ID
function getUserById(id: string) { ... }

// ❌ BAD - "how" comment
// This function:
// 1. Validates the input
// 2. Queries the database
// 3. Transforms the result
function processUser(data) { ... }

// ✅ GOOD - "why" comment
// Using setTimeout instead of setImmediate because Node.js
// event loop phases cause race conditions with DB connections
setTimeout(checkConnection, 0);

// ✅ GOOD - no comment needed, self-documenting
function getUserById(id: string) { ... }
function validateAndTransformUser(rawData: unknown): User { ... }
```

### File Size Limits

**Keep files focused and maintainable by limiting file size to ~200-300 lines of production code.**

Guidelines:

- ✅ **Target: 200-300 lines** - Aim for files in this range (excluding tests)
- ✅ **Split at logical boundaries** - Break large files into cohesive submodules
- ✅ **Single Responsibility** - Each file should have one clear purpose
- ❌ **Avoid mega-files** - Files over 500 lines are usually doing too much
- 🔧 **Refactor when needed** - If a file grows beyond 300 lines, look for natural split points

When counting:

- Count only production code (exclude tests)
- Blank lines and imports don't count toward cognitive load
- Focus on keeping the logic focused and navigable

## Package Manager

- This project uses **npm** as the package manager
- Always use `npm` commands: `npm install`, `npm run`, `npm test`, etc.
- Dependencies are locked in `package-lock.json` - commit this file
- Do not use `yarn`, `pnpm`, or `bun` commands
- Node.js v22.22.2 or compatible required
