---
type: skill-spec
name: performance-optimization
version: 1.0.0
triggers:
  - "optimize"
  - "performance"
  - "speed up"
  - "ускорь"
  - "оптимизируй"
  - "bottleneck"
  - "slow"
category: quality
confidence_threshold: 0.85
---

# Performance Optimization Skill

## Purpose
Identify and fix performance bottlenecks, optimize algorithms, and improve application speed and resource usage.

## When to Use
- Code is running slower than expected
- High memory usage reported
- Database queries are slow
- API response times are high
- Profiling shows hot spots
- Scaling issues occur

## Optimization Priorities

### 1. Algorithm Efficiency (Priority: Critical)
- Time complexity analysis (Big O)
- Space complexity optimization
- Data structure selection
- Algorithm replacement opportunities

### 2. Database Optimization (Priority: High)
- Query optimization
- Index usage analysis
- N+1 query elimination
- Connection pooling
- Caching strategies

### 3. Memory Management (Priority: High)
- Memory leak detection
- Object pooling opportunities
- Garbage collection optimization
- Large object handling
- Memory fragmentation

### 4. Concurrency & Parallelism (Priority: Medium)
- Async/await optimization
- Thread pool tuning
- Lock contention reduction
- Parallel processing opportunities
- Race condition prevention

### 5. I/O Optimization (Priority: Medium)
- File system operations
- Network request batching
- Streaming vs buffering
- Compression usage
- CDN utilization

## Execution Steps

### Step 1: Profile & Measure
```
1. Identify slow operations
2. Measure baseline performance
3. Find hot code paths
4. Analyze resource usage
```

### Step 2: Analyze Algorithms
```
1. Review nested loops
2. Check data structure choices
3. Look for redundant calculations
4. Identify caching opportunities
```

### Step 3: Optimize Queries
```
1. Analyze query execution plans
2. Check for missing indexes
3. Identify N+1 patterns
4. Review transaction boundaries
```

### Step 4: Implement Fixes
```
1. Apply optimizations
2. Add caching where appropriate
3. Refactor inefficient code
4. Optimize data structures
```

### Step 5: Validate Improvements
```
1. Re-measure performance
2. Compare with baseline
3. Check for regressions
4. Document improvements
```

## Output Format

```markdown
## Performance Optimization Report

### Current State Analysis
- **Baseline Performance**: X ms / X MB
- **Hot Code Paths**: Identified sections
- **Resource Usage**: CPU/Memory/Network breakdown

### Issues Found

#### Issue 1: [Algorithm Name] - O(n²) Complexity
- **Severity**: 🔴 Critical
- **Location**: `file.ts:45-67`
- **Current Complexity**: O(n²)
- **Optimized Complexity**: O(n log n)
- **Expected Improvement**: 80% faster
- **Implementation**:
  ```typescript
  // Before: O(n²)
  function findDuplicates(arr) {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] === arr[j]) result.push(arr[i]);
      }
    }
    return result;
  }
  
  // After: O(n)
  function findDuplicates(arr) {
    const seen = new Set();
    const duplicates = new Set();
    for (const item of arr) {
      if (seen.has(item)) duplicates.add(item);
      seen.add(item);
    }
    return Array.from(duplicates);
  }
  ```

#### Issue 2: Database N+1 Query
- **Severity**: 🟠 High
- **Location**: `user-service.ts:23`
- **Current**: 101 queries for 100 users
- **Optimized**: 2 queries (batch)
- **Expected Improvement**: 50x fewer queries

### Optimizations Applied

| Issue | Before | After | Improvement |
|-------|--------|-------|-------------|
| Algorithm | O(n²) | O(n) | 95% faster |
| DB Queries | 101 | 2 | 98% reduction |
| Memory | 512 MB | 256 MB | 50% reduction |

### Benchmarks

```
Before Optimization:
- Response Time: 1,200 ms (p95)
- Memory Usage: 512 MB
- Database Queries: 101

After Optimization:
- Response Time: 45 ms (p95) ✅ 96% faster
- Memory Usage: 256 MB ✅ 50% reduction
- Database Queries: 2 ✅ 98% reduction
```

### Recommendations

1. **Immediate (This Sprint)**
   - [ ] Replace O(n²) algorithm in search
   - [ ] Add database index on user_id
   - [ ] Implement Redis caching

2. **Short-term (Next 2 Weeks)**
   - [ ] Add connection pooling
   - [ ] Implement query result caching
   - [ ] Optimize static asset delivery

3. **Long-term (Next Month)**
   - [ ] Consider database sharding
   - [ ] Implement CDN for static content
   - [ ] Add application-level caching layer

### Monitoring

Set up alerts for:
- Response time > 100ms (p95)
- Memory usage > 300 MB
- Database query count > 10 per request
- Error rate > 0.1%

## Common Optimization Patterns

### Pattern 1: Loop Optimization
```typescript
// Before
for (let i = 0; i < array.length; i++) {
  // array.length accessed every iteration
}

// After
for (let i = 0, len = array.length; i < len; i++) {
  // len cached, faster
}
```

### Pattern 2: Memoization
```typescript
// Before
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2); // O(2^n)
}

// After
const memo = new Map();
function fibonacci(n) {
  if (memo.has(n)) return memo.get(n);
  if (n <= 1) return n;
  const result = fibonacci(n - 1) + fibonacci(n - 2);
  memo.set(n, result);
  return result;
} // O(n)
```

### Pattern 3: Database Query Batching
```typescript
// Before: N+1 queries
const users = await db.query('SELECT * FROM users');
for (const user of users) {
  user.orders = await db.query('SELECT * FROM orders WHERE user_id = ?', user.id);
}

// After: 2 queries
const users = await db.query('SELECT * FROM users');
const userIds = users.map(u => u.id);
const orders = await db.query('SELECT * FROM orders WHERE user_id IN (?)', [userIds]);
const ordersByUser = groupBy(orders, 'user_id');
for (const user of users) {
  user.orders = ordersByUser[user.id] || [];
}
```

## Language-Specific Optimizations

### TypeScript/JavaScript
- Use `const` over `let` for JIT optimization hints
- Prefer `Map`/`Set` over objects for frequent lookups
- Use `for...of` instead of `forEach` for performance
- Leverage V8 hidden classes for object shapes
- Use `Buffer` for binary data operations

### Python
- Use list comprehensions over loops
- Leverage `numpy`/`pandas` for numeric operations
- Use `generators` for large datasets
- Profile with `cProfile` and `line_profiler`
- Consider `Cython` for critical paths

### Java
- Use `StringBuilder` for string concatenation
- Leverage `Streams` for collection operations
- Use `ConcurrentHashMap` for thread safety
- Profile with JProfiler or VisualVM
- Consider `GraalVM` for better performance

### Go
- Use `sync.Pool` for object reuse
- Leverage `channels` for communication
- Use `benchmark` for performance testing
- Profile with `pprof`
- Consider `arena` allocation for batch operations

## Qoder Integration

### Chat Mode
```
"Optimize this function for better performance"
"Find bottlenecks in this code"
"Ускорь этот алгоритм"
"Analyze Big O complexity"
```

### Agent Mode
```
1. Provide code to optimize
2. Activate: "Use performance-optimization skill"
3. Set target metrics (e.g., "reduce to < 100ms")
```

### Quest Mode
For large optimization projects:
- Duration: 20-40 minutes
- Scope: module or service
- Deliverable: optimized code + benchmark report

## Completion Criteria
- [ ] Baseline performance measured
- [ ] Bottlenecks identified and documented
- [ ] Optimizations implemented
- [ ] Performance improvement verified
- [ ] No functional regressions
- [ ] Monitoring set up

---
**Skill Version**: 1.0.0
**Based on**: claude-howto optimize command
**Adapted for**: Qoder IDE
