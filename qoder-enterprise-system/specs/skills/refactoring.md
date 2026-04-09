---
type: skill-spec
name: refactoring
version: 1.0.0
triggers:
  - "refactor"
  - "refactoring"
  - "clean code"
  - "improve structure"
  - "рефакторинг"
  - "улучши код"
category: maintenance
confidence_threshold: 0.8
---

# Refactoring Skill

## Purpose
Systematically improve code structure, readability, and maintainability without changing external behavior.

## When to Use
- Code complexity is high
- Duplication detected
- Preparing for new features
- Code review suggestions
- Technical debt reduction
- Performance optimization prep

## Refactoring Priorities

### 1. Complexity Reduction (Priority: Critical)
- Extract methods/functions
- Simplify conditionals
- Reduce nesting depth
- Break large classes/modules

### 2. Duplication Elimination (Priority: High)
- Extract common code
- Create reusable functions
- Apply DRY principle
- Template method pattern

### 3. Naming Improvement (Priority: High)
- Clear variable names
- Descriptive function names
- Consistent naming conventions
- Domain-specific terminology

### 4. Structure Improvement (Priority: Medium)
- Better module organization
- Improved class hierarchy
- Clearer separation of concerns
- Enhanced cohesion

### 5. Modern Patterns (Priority: Low)
- Update to modern syntax
- Apply design patterns
- Use language features
- Improve type safety

## Refactoring Patterns

### Pattern 1: Extract Method/Function
```typescript
// Before: Long function with mixed concerns
function processOrder(order: Order): void {
  // Validate order
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  
  // Calculate totals
  let subtotal = 0;
  for (const item of order.items) {
    subtotal += item.price * item.quantity;
  }
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  
  // Save to database
  const query = `INSERT INTO orders (total, tax) VALUES (${total}, ${tax})`;
  db.execute(query);
  
  // Send confirmation
  const email = buildEmail(order, total);
  emailService.send(email);
}

// After: Extracted functions with single responsibility
function processOrder(order: Order): void {
  validateOrder(order);
  const totals = calculateTotals(order.items);
  saveOrder(order, totals);
  sendConfirmation(order, totals.total);
}

function validateOrder(order: Order): void {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
}

function calculateTotals(items: OrderItem[]): Totals {
  const subtotal = items.reduce((sum, item) => 
    sum + item.price * item.quantity, 0
  );
  const tax = subtotal * 0.08;
  return { subtotal, tax, total: subtotal + tax };
}

function saveOrder(order: Order, totals: Totals): void {
  const query = 'INSERT INTO orders (total, tax) VALUES (?, ?)';
  db.execute(query, [totals.total, totals.tax]);
}

function sendConfirmation(order: Order, total: number): void {
  const email = buildEmail(order, total);
  emailService.send(email);
}
```

### Pattern 2: Replace Conditional with Polymorphism
```typescript
// Before: Switch statements
function calculatePrice(product: Product, customer: Customer): number {
  switch (product.type) {
    case 'book':
      return customer.isMember ? product.price * 0.9 : product.price;
    case 'electronics':
      return customer.isMember ? product.price * 0.95 : product.price;
    case 'clothing':
      return customer.isMember ? product.price * 0.85 : product.price;
    default:
      return product.price;
  }
}

// After: Strategy pattern
interface PricingStrategy {
  calculate(price: number, isMember: boolean): number;
}

class BookPricing implements PricingStrategy {
  calculate(price: number, isMember: boolean): number {
    return isMember ? price * 0.9 : price;
  }
}

class ElectronicsPricing implements PricingStrategy {
  calculate(price: number, isMember: boolean): number {
    return isMember ? price * 0.95 : price;
  }
}

class ClothingPricing implements PricingStrategy {
  calculate(price: number, isMember: boolean): number {
    return isMember ? price * 0.85 : price;
  }
}

const strategies: Record<string, PricingStrategy> = {
  book: new BookPricing(),
  electronics: new ElectronicsPricing(),
  clothing: new ClothingPricing(),
};

function calculatePrice(product: Product, customer: Customer): number {
  const strategy = strategies[product.type];
  return strategy?.calculate(product.price, customer.isMember) ?? product.price;
}
```

### Pattern 3: Introduce Parameter Object
```typescript
// Before: Long parameter list
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  address: string,
  city: string,
  country: string
): User {
  // ...
}

// After: Parameter object
interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    country: string;
  };
}

function createUser(request: CreateUserRequest): User {
  // ...
}

// Usage
createUser({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  address: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA'
  }
});
```

### Pattern 4: Replace Magic Numbers
```typescript
// Before
if (status === 200) {
  processSuccess();
} else if (status === 404) {
  processNotFound();
} else if (status === 500) {
  processError();
}

// After
const HttpStatus = {
  OK: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
} as const;

if (status === HttpStatus.OK) {
  processSuccess();
} else if (status === HttpStatus.NOT_FOUND) {
  processNotFound();
} else if (status === HttpStatus.SERVER_ERROR) {
  processError();
}
```

## Output Format

```markdown
## Refactoring Report

### Code Analysis

**File**: `src/order-service.ts`
**Current Metrics**:
- Lines of Code: 347
- Cyclomatic Complexity: 18 (high)
- Cognitive Complexity: 24 (very high)
- Duplicate Code: 23%
- Function Count: 12
- Average Function Length: 29 lines (too long)

### Issues Identified

#### Issue 1: High Complexity in processOrder
- **Location**: `order-service.ts:45-89`
- **Current Complexity**: 18
- **Target Complexity**: < 10
- **Refactoring Strategy**: Extract Method

#### Issue 2: Code Duplication in Price Calculation
- **Location**: Lines 120-135, 156-171, 189-204
- **Duplication**: 3 instances of similar logic
- **Refactoring Strategy**: Extract Common Function

#### Issue 3: Poor Variable Naming
- **Location**: Throughout file
- **Issues**: Single letter variables, unclear abbreviations
- **Refactoring Strategy**: Rename Variables

### Refactoring Plan

#### Phase 1: Extract Methods (Estimated: 30 min)
- [ ] Extract `validateOrder` from `processOrder`
- [ ] Extract `calculateTotals` from `processOrder`
- [ ] Extract `applyDiscounts` from `calculateTotals`
- [ ] Extract `saveToDatabase` from `processOrder`

#### Phase 2: Eliminate Duplication (Estimated: 20 min)
- [ ] Create `calculateItemPrice` function
- [ ] Create `applyMemberDiscount` function
- [ ] Replace duplicated code with function calls

#### Phase 3: Improve Naming (Estimated: 15 min)
- [ ] Rename `x` → `itemCount`
- [ ] Rename `tmp` → `orderTotal`
- [ ] Rename `calc` → `calculateDiscount`
- [ ] Rename `data` → `orderData`

### Refactored Code

```typescript
// order-service.ts - Refactored Version

interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface ProcessingResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export class OrderService {
  constructor(
    private readonly db: Database,
    private readonly pricing: PricingService,
    private readonly email: EmailService
  ) {}

  async processOrder(order: Order): Promise<ProcessingResult> {
    try {
      this.validateOrder(order);
      const totals = this.calculateOrderTotals(order);
      const orderId = await this.persistOrder(order, totals);
      await this.sendConfirmation(order, orderId, totals);
      
      return { success: true, orderId };
    } catch (error) {
      return { 
        success: false, 
        error: this.formatError(error) 
      };
    }
  }

  private validateOrder(order: Order): void {
    if (!order.items?.length) {
      throw new OrderValidationError('Order must contain at least one item');
    }
    
    if (order.items.some(item => item.quantity <= 0)) {
      throw new OrderValidationError('All items must have positive quantity');
    }
  }

  private calculateOrderTotals(order: Order): OrderTotals {
    const subtotal = order.items.reduce((sum, item) => 
      sum + this.calculateItemPrice(item), 0
    );
    
    const discount = this.calculateDiscount(order, subtotal);
    const taxableAmount = subtotal - discount;
    const tax = this.pricing.calculateTax(taxableAmount, order.customer.region);
    
    return {
      subtotal,
      discount,
      tax,
      total: taxableAmount + tax
    };
  }

  private calculateItemPrice(item: OrderItem): number {
    const basePrice = item.product.price * item.quantity;
    const itemDiscount = this.pricing.getItemDiscount(item.product, item.quantity);
    return basePrice - itemDiscount;
  }

  private calculateDiscount(order: Order, subtotal: number): number {
    if (!order.customer.isMember) return 0;
    
    const memberDiscountRate = this.pricing.getMemberDiscountRate(
      order.customer.membershipLevel
    );
    
    return subtotal * memberDiscountRate;
  }

  private async persistOrder(
    order: Order, 
    totals: OrderTotals
  ): Promise<string> {
    const orderRecord: OrderRecord = {
      customerId: order.customer.id,
      items: order.items.map(this.mapOrderItem),
      totals,
      status: 'pending',
      createdAt: new Date()
    };
    
    return this.db.orders.insert(orderRecord);
  }

  private async sendConfirmation(
    order: Order,
    orderId: string,
    totals: OrderTotals
  ): Promise<void> {
    const email = this.email.buildOrderConfirmation({
      orderId,
      customer: order.customer,
      items: order.items,
      totals,
      estimatedDelivery: this.calculateDeliveryDate(order)
    });
    
    await this.email.send(email);
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error occurred';
  }
}
```

### Metrics After Refactoring

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines of Code | 347 | 156 | -55% ✅ |
| Cyclomatic Complexity | 18 | 8 | -56% ✅ |
| Cognitive Complexity | 24 | 9 | -63% ✅ |
| Duplicate Code | 23% | 0% | -100% ✅ |
| Function Count | 12 | 9 | -25% ✅ |
| Avg Function Length | 29 | 12 | -59% ✅ |
| Testability | Low | High | +++ ✅ |

### Testing Refactored Code

```typescript
describe('OrderService', () => {
  let service: OrderService;
  let mockDb: MockDatabase;
  let mockPricing: MockPricingService;
  let mockEmail: MockEmailService;

  beforeEach(() => {
    mockDb = createMockDatabase();
    mockPricing = createMockPricingService();
    mockEmail = createMockEmailService();
    service = new OrderService(mockDb, mockPricing, mockEmail);
  });

  describe('validateOrder', () => {
    it('should throw for empty order', () => {
      expect(() => service['validateOrder']({ items: [] }))
        .toThrow('Order must contain at least one item');
    });
  });

  describe('calculateOrderTotals', () => {
    it('should calculate correct totals', () => {
      const order = createTestOrder({
        items: [
          { product: { price: 100 }, quantity: 2 },
          { product: { price: 50 }, quantity: 1 }
        ]
      });
      
      const totals = service['calculateOrderTotals'](order);
      
      expect(totals.subtotal).toBe(250);
    });
  });
});
```

### Next Steps

1. **Immediate** (This PR)
   - [ ] Apply refactoring changes
   - [ ] Update unit tests
   - [ ] Run integration tests

2. **Follow-up** (Next Sprint)
   - [ ] Extract OrderService to separate module
   - [ ] Add integration tests
   - [ ] Update API documentation

3. **Future Improvements**
   - [ ] Consider adding OrderBuilder pattern
   - [ ] Implement event-driven architecture
   - [ ] Add caching layer

## Qoder Integration

### Chat Mode
```
"Refactor this function to reduce complexity"
"Clean up this code duplication"
"Improve variable names in this file"
"Apply extract method pattern here"
```

### Agent Mode
```
1. Select code to refactor
2. Activate: "Use refactoring skill"
3. Specify focus: complexity/duplication/naming/all
```

### Quest Mode
For large refactoring:
- Duration: 30-60 minutes
- Scope: module or service
- Deliverable: refactored code + test updates

## Safety Guidelines

### Before Refactoring
- [ ] All tests pass
- [ ] Code is committed
- [ ] Backup/branch created
- [ ] Scope clearly defined

### During Refactoring
- [ ] One refactoring at a time
- [ ] Run tests after each change
- [ ] Use IDE automated refactorings when possible
- [ ] Commit frequently

### After Refactoring
- [ ] All tests pass
- [ ] No functional changes
- [ ] Code review completed
- [ ] Documentation updated

## Completion Criteria
- [ ] Complexity metrics improved
- [ ] Duplication eliminated
- [ ] Naming improved
- [ ] All tests pass
- [ ] No functional changes
- [ ] Code review approved
- [ ] Documentation updated

---
**Skill Version**: 1.0.0
**Based on**: claude-howto refactoring patterns
**Adapted for**: Qoder IDE
