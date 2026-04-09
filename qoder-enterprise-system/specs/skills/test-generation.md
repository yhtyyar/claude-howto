---
type: skill-spec
name: test-generation
version: 1.0.0
triggers:
  - "generate tests"
  - "create tests"
  - "test coverage"
  - "write tests"
  - "тесты"
  - "покрытие тестами"
  - "unit test"
  - "integration test"
category: testing
confidence_threshold: 0.8
---

# Test Generation Skill

## Purpose
Generate comprehensive test suites including unit tests, integration tests, and edge case coverage for code reliability.

## When to Use
- New feature implementation
- Code review requires tests
- Low test coverage reported
- Refactoring existing code
- Bug fix verification
- TDD workflow

## Test Types

### 1. Unit Tests (Priority: High)
- Individual function/method testing
- Isolated component testing
- Mock external dependencies
- Fast execution (< 100ms per test)

### 2. Integration Tests (Priority: High)
- Component interaction testing
- Database integration
- API endpoint testing
- Service communication

### 3. Edge Cases (Priority: Critical)
- Empty/null inputs
- Boundary values
- Maximum/minimum values
- Malformed data
- Concurrent access
- Error conditions

### 4. Property-Based Tests (Priority: Medium)
- Invariant checking
- Randomized input testing
- Mathematical property verification

## Execution Steps

### Step 1: Analyze Code Under Test
```
1. Identify public APIs
2. Determine input/output contracts
3. Find dependencies
4. Identify side effects
5. Locate error paths
```

### Step 2: Design Test Cases
```
1. Happy path scenarios
2. Error conditions
3. Edge cases
4. Boundary values
5. State transitions
```

### Step 3: Generate Test Code
```
1. Set up test framework
2. Write test cases
3. Add assertions
4. Include mocks/stubs
5. Add test documentation
```

### Step 4: Validate Tests
```
1. Run generated tests
2. Check coverage
3. Fix failing tests
4. Add missing scenarios
5. Optimize slow tests
```

## Output Format

```markdown
## Test Generation Report

### Coverage Analysis
- **File**: `src/service.ts`
- **Current Coverage**: 23%
- **Target Coverage**: 80%
- **Functions to Test**: 5

### Generated Tests

#### Unit Tests

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const userData = { name: 'John', email: 'invalid-email' };
      
      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      const userData = { name: 'John', email: 'exists@example.com' };
      mockDb.findUser.mockResolvedValue({ id: 1, ...userData });
      
      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Email already exists');
    });

    it('should handle empty name', async () => {
      // Arrange
      const userData = { name: '', email: 'john@example.com' };
      
      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Name is required');
    });
  });
});
```

#### Integration Tests

```typescript
describe('User API Integration', () => {
  it('should create user through API', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('createdAt');
  });

  it('should return 400 for invalid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: '', email: 'invalid' });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });
});
```

#### Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle very long name (255 chars)', async () => {
    const longName = 'a'.repeat(255);
    const result = await userService.createUser({
      name: longName,
      email: 'test@example.com'
    });
    expect(result.name).toBe(longName);
  });

  it('should handle special characters in name', async () => {
    const specialName = 'John O\'Connor-Smith Jr.';
    const result = await userService.createUser({
      name: specialName,
      email: 'test@example.com'
    });
    expect(result.name).toBe(specialName);
  });

  it('should handle concurrent creates', async () => {
    const promises = Array(10).fill(null).map((_, i) =>
      userService.createUser({
        name: `User ${i}`,
        email: `user${i}@example.com`
      })
    );
    
    const results = await Promise.all(promises);
    const ids = results.map(r => r.id);
    
    // All IDs should be unique
    expect(new Set(ids).size).toBe(10);
  });
});
```

### Coverage Summary

| Function | Tests | Coverage |
|----------|-------|----------|
| createUser | 8 | 100% |
| updateUser | 6 | 95% |
| deleteUser | 4 | 90% |
| findUser | 5 | 100% |
| listUsers | 3 | 85% |

**Total Coverage**: 94% ✅ (Target: 80%)

### Test Execution

```bash
$ npm test -- --coverage

PASS  src/__tests__/user-service.test.ts
  UserService
    createUser
      ✓ should create user with valid data (45ms)
      ✓ should throw error for invalid email (12ms)
      ✓ should throw error for duplicate email (8ms)
      ✓ should handle empty name (6ms)
      ✓ should handle very long name (15ms)
      ✓ should handle special characters (9ms)
      ✓ should handle concurrent creates (78ms)
      ✓ should validate email format (11ms)

Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
Coverage:    94.23% | 85/90 lines
Time:        2.4s
```

### Recommendations

1. **Immediate Actions**
   - [ ] Add tests for error handling in `listUsers`
   - [ ] Improve coverage for `validateUser` function
   - [ ] Add database transaction rollback test

2. **Future Improvements**
   - [ ] Add property-based tests with fast-check
   - [ ] Implement contract tests for API
   - [ ] Add load testing for concurrent operations

## Framework-Specific Templates

### Jest (TypeScript)
```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UserService } from '../user-service';

describe('UserService', () => {
  let service: UserService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      findUser: jest.fn(),
      createUser: jest.fn(),
    };
    service = new UserService(mockDb);
  });

  describe('methodName', () => {
    it('should ... when ...', async () => {
      // Test implementation
    });
  });
});
```

### Pytest (Python)
```python
import pytest
from unittest.mock import Mock, patch
from user_service import UserService

class TestUserService:
    @pytest.fixture
    def service(self):
        mock_db = Mock()
        return UserService(mock_db)

    def test_create_user_success(self, service):
        # Arrange
        user_data = {"name": "John", "email": "john@example.com"}
        
        # Act
        result = service.create_user(user_data)
        
        # Assert
        assert result.name == user_data["name"]
        assert "id" in result
```

### JUnit 5 (Java)
```java
import org.junit.jupiter.api.*;
import org.mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserServiceTest {
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private UserService userService;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }
    
    @Test
    void shouldCreateUserWithValidData() {
        // Arrange
        UserData data = new UserData("John", "john@example.com");
        when(userRepository.existsByEmail(any())).thenReturn(false);
        
        // Act
        User result = userService.createUser(data);
        
        // Assert
        assertNotNull(result.getId());
        assertEquals(data.getName(), result.getName());
    }
}
```

## Qoder Integration

### Chat Mode
```
"Generate tests for this function"
"Create unit tests for the auth module"
"Write tests to cover edge cases"
"Improve test coverage for this file"
```

### Agent Mode
```
1. Select code to test
2. Activate: "Use test-generation skill"
3. Specify test type: unit/integration/edge-cases
```

### Quest Mode
For comprehensive test coverage:
- Duration: 15-30 minutes
- Scope: module or feature
- Deliverable: complete test suite + coverage report

## Completion Criteria
- [ ] Unit tests for all public functions
- [ ] Integration tests for APIs
- [ ] Edge cases covered (null, empty, boundary)
- [ ] Error paths tested
- [ ] Coverage meets target (80%+)
- [ ] All tests pass
- [ ] No test takes > 1 second

---
**Skill Version**: 1.0.0
**Based on**: claude-howto test skills
**Adapted for**: Qoder IDE
