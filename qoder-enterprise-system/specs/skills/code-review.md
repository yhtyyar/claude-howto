---
type: skill-spec
name: code-review
version: 1.0.0
triggers:
  - "code review"
  - "review code"
  - "проверь код"
  - "find bugs"
  - "analyze code"
category: quality
confidence_threshold: 0.8
---

# Code Review Skill

## Purpose
Comprehensive code analysis focusing on security, performance, quality, and maintainability.

## When to Use
- Before committing code
- During PR preparation
- After implementing features
- When security concerns exist
- For performance optimization candidates

## Execution Steps

### 1. Initial Assessment
Read and understand the code structure, purpose, and context.

### 2. Security Analysis (Priority: Critical)
- [ ] Check for SQL injection vulnerabilities
- [ ] Verify input validation and sanitization
- [ ] Look for XSS vulnerabilities in web code
- [ ] Identify hardcoded credentials or secrets
- [ ] Check authentication/authorization logic
- [ ] Verify secure data handling (encryption, hashing)
- [ ] Review file upload handling
- [ ] Check for command injection risks

### 3. Performance Review (Priority: High)
- [ ] Analyze algorithm complexity (Big O)
- [ ] Identify N+1 query problems
- [ ] Check for memory leaks
- [ ] Look for inefficient loops
- [ ] Review caching strategies
- [ ] Verify database query optimization
- [ ] Check async/await usage
- [ ] Identify blocking operations

### 4. Code Quality (Priority: Medium)
- [ ] SOLID principles adherence
- [ ] Design pattern appropriateness
- [ ] Naming conventions compliance
- [ ] Function/method length (max 50 lines)
- [ ] Class/module cohesion
- [ ] Code duplication (DRY principle)
- [ ] Comment quality and necessity
- [ ] Documentation completeness

### 5. Maintainability (Priority: Medium)
- [ ] Test coverage adequacy
- [ ] Error handling robustness
- [ ] Logging appropriateness
- [ ] Configuration management
- [ ] Dependency management
- [ ] Type safety (for typed languages)
- [ ] API contract clarity

## Output Format

```markdown
## Code Review Report

### Executive Summary
- **Overall Rating**: 1-5 (5 = excellent)
- **Critical Issues**: {count}
- **High Priority**: {count}
- **Medium Priority**: {count}
- **Low Priority**: {count}

### Critical Issues (Must Fix)

#### Issue 1: [Title]
- **Severity**: 🔴 Critical
- **Category**: Security/Performance/Quality
- **Location**: `file.ts:line-col`
- **Description**: Clear explanation
- **Impact**: What could go wrong
- **Fix Example**:
  ```typescript
  // Before
  const userInput = req.query.name;
  const result = db.query(`SELECT * FROM users WHERE name = '${userInput}'`);
  
  // After
  const userInput = req.query.name;
  const result = db.query('SELECT * FROM users WHERE name = ?', [userInput]);
  ```

### High Priority Issues (Should Fix)

#### Issue X: [Title]
- **Severity**: 🟠 High
- **Category**: [Category]
- **Location**: `file.ts:line-col`
- **Description**: Explanation
- **Recommendation**: How to fix

### Medium Priority (Consider)

#### Issue Y: [Title]
- **Severity**: 🟡 Medium
- **Category**: [Category]
- **Location**: `file.ts:line-col`
- **Suggestion**: Improvement idea

### Positive Findings
- ✅ Well-structured error handling
- ✅ Good separation of concerns
- ✅ Appropriate use of async/await

### Recommendations
1. [Actionable recommendation]
2. [Another recommendation]

### Next Steps
- [ ] Address critical issues
- [ ] Create tickets for high priority items
- [ ] Schedule refactoring for medium priority
```

## Language-Specific Checks

### TypeScript/JavaScript
- Type safety violations
- Null/undefined handling
- Promise/async mismatches
- Event listener leaks
- Prototype pollution risks

### Python
- Type hint coverage
- Exception handling
- Mutable default arguments
- Resource leaks (files, connections)
- GIL contention in async code

### Java
- Null pointer risks
- Resource management (try-with-resources)
- Concurrency issues
- Serialization concerns
- Generics usage

### Go
- Error handling patterns
- Goroutine leaks
- Channel blocking
- Context propagation
- Race conditions

## Examples

### Example 1: Security Issue Detection
**Input**: Express.js route with raw SQL
```javascript
app.get('/user', (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.query.id}`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});
```

**Output**:
- **Severity**: Critical
- **Issue**: SQL Injection
- **Location**: Line 2
- **Fix**: Use parameterized queries

### Example 2: Performance Issue
**Input**: Nested loop with database queries
```javascript
for (const user of users) {
  for (const order of user.orders) {
    const details = await db.query('SELECT * FROM details WHERE order_id = ?', order.id);
    // ...
  }
}
```

**Output**:
- **Severity**: High
- **Issue**: N+1 Query Problem (O(n²) database calls)
- **Fix**: Use JOIN or batch queries

## Qoder Integration

### Chat Mode Usage
```
"Проверь этот код на проблемы безопасности"
"Review this function for performance issues"
"Code review: analyze the auth module"
```

### Agent Mode Usage
1. Select code to review
2. Activate: "Используй skill code-review"
3. Provide context about specific concerns

### Quest Mode Usage
For large codebases:
- Duration: 15-30 minutes
- Scope: specific module or package
- Deliverable: comprehensive review report

## Completion Criteria
- [ ] All critical issues identified
- [ ] High priority issues documented
- [ ] Fix examples provided for critical issues
- [ ] Overall quality rating assigned
- [ ] Actionable next steps defined

---
**Skill Version**: 1.0.0
**Based on**: claude-howto code-review skill
**Adapted for**: Qoder IDE
