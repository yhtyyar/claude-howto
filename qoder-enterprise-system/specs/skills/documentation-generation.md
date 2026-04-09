---
type: skill-spec
name: documentation-generation
version: 1.0.0
triggers:
  - "generate docs"
  - "create documentation"
  - "write readme"
  - "api docs"
  - "документация"
  - "опиши"
  - "jsdoc"
  - "openapi"
category: documentation
confidence_threshold: 0.75
---

# Documentation Generation Skill

## Purpose
Generate comprehensive documentation including README files, API documentation, inline code comments, and technical specifications.

## When to Use
- New project initialization
- API documentation needed
- README needs updating
- Code lacks inline documentation
- Onboarding documentation required
- Architecture decision records (ADRs)

## Documentation Types

### 1. README.md (Priority: High)
- Project overview
- Installation instructions
- Usage examples
- API quick reference
- Contributing guidelines

### 2. API Documentation (Priority: High)
- OpenAPI/Swagger specs
- Endpoint descriptions
- Request/response schemas
- Authentication details
- Error codes

### 3. Inline Documentation (Priority: Medium)
- JSDoc/TSDoc comments
- Python docstrings
- JavaDoc comments
- Complexity explanations
- Usage examples in comments

### 4. Architecture Docs (Priority: Medium)
- System architecture diagrams
- Component descriptions
- Data flow documentation
- ADRs (Architecture Decision Records)

## Execution Steps

### Step 1: Analyze Codebase
```
1. Identify project structure
2. Find public APIs
3. Locate complex logic
4. Identify entry points
5. Check existing docs
```

### Step 2: Generate Structure
```
1. Create documentation outline
2. Define sections needed
3. Plan code examples
4. Organize by audience
```

### Step 3: Write Content
```
1. Generate descriptions
2. Add code examples
3. Include diagrams (if applicable)
4. Add troubleshooting
```

### Step 4: Validate & Format
```
1. Check markdown formatting
2. Verify code examples compile
3. Ensure links work
4. Check for completeness
```

## Output Format

### README.md Template

```markdown
# Project Name

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

> Brief project description (one sentence)

## Features

- ✨ Feature 1: Description
- 🚀 Feature 2: Description
- 🔒 Feature 3: Description
- 📊 Feature 4: Description

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Quick Start

```bash
# Clone repository
git clone https://github.com/username/project.git
cd project

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start development
npm run dev
```

## Usage

### Basic Example

```typescript
import { Client } from 'project';

const client = new Client({
  apiKey: 'your-api-key',
  environment: 'production'
});

const result = await client.process({
  input: 'example data'
});

console.log(result);
```

### Advanced Configuration

```typescript
const client = new Client({
  apiKey: process.env.API_KEY,
  environment: 'production',
  timeout: 30000,
  retries: 3,
  cache: {
    enabled: true,
    ttl: 3600
  }
});
```

## API Reference

### Client

#### `constructor(options: ClientOptions)`

Creates a new client instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apiKey | string | Yes | API authentication key |
| environment | 'production' \| 'staging' | No | API environment (default: 'production') |
| timeout | number | No | Request timeout in ms (default: 10000) |

**Example:**

```typescript
const client = new Client({ apiKey: 'key-123' });
```

#### `async process(data: ProcessData): Promise<ProcessResult>`

Processes input data and returns result.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| data.input | string | Yes | Input data to process |
| data.options | ProcessOptions | No | Processing options |

**Returns:** `Promise<ProcessResult>`

**Errors:**

| Code | Description |
|------|-------------|
| 400 | Invalid input data |
| 401 | Authentication failed |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

**Example:**

```typescript
try {
  const result = await client.process({ input: 'data' });
  console.log(result.output);
} catch (error) {
  if (error.code === 429) {
    console.log('Rate limited, retry later');
  }
}
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| API_KEY | Yes | - | API authentication key |
| API_ENV | No | production | API environment |
| TIMEOUT | No | 10000 | Request timeout (ms) |
| LOG_LEVEL | No | info | Logging level |

## Examples

See [examples/](examples/) directory for more usage examples.

- [Basic Usage](examples/basic.ts)
- [Advanced Configuration](examples/advanced.ts)
- [Error Handling](examples/error-handling.ts)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE) © [Author Name]
```

### OpenAPI Specification Template

```yaml
openapi: 3.0.0
info:
  title: Project API
  version: 1.0.0
  description: |
    API for project management and operations.
    
    ## Features
    - Feature 1
    - Feature 2
    
  contact:
    name: API Support
    email: api@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server

paths:
  /users:
    get:
      summary: List users
      operationId: listUsers
      tags:
        - Users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
          description: Page number
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
          description: Items per page
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimit'
    
    post:
      summary: Create user
      operationId: createUser
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserInput'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
      required:
        - id
        - name
        - email
    
    UserInput:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
        email:
          type: string
          format: email
      required:
        - name
        - email
    
    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer
      required:
        - page
        - limit
        - total
        - totalPages
  
  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              details:
                type: array
                items:
                  type: object
                  properties:
                    field:
                      type: string
                    message:
                      type: string
    
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
    
    RateLimit:
      description: Too many requests
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              retryAfter:
                type: integer

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

### Inline Documentation Template

```typescript
/**
 * Processes user data and generates analytics report.
 * 
 * This function performs the following operations:
 * 1. Validates input data structure
 * 2. Enriches data with external sources
 * 3. Calculates metrics and aggregates
 * 4. Generates formatted report
 * 
 * @param data - Raw user data for processing
 * @param options - Processing configuration options
 * @returns Promise resolving to generated analytics report
 * @throws {ValidationError} When input data is invalid
 * @throws {ProcessingError} When processing fails
 * @throws {TimeoutError} When operation exceeds timeout
 * 
 * @example
 * Basic usage:
 * ```typescript
 * const report = await processUserData(
 *   { users: [{ id: 1, name: 'John' }] },
 *   { format: 'json' }
 * );
 * ```
 * 
 * @example
 * With custom timeout:
 * ```typescript
 * const report = await processUserData(
 *   data,
 *   { timeout: 30000, includeMetadata: true }
 * );
 * ```
 * 
 * @see {@link AnalyticsReport} for output structure
 * @see {@link validateUserData} for validation rules
 * 
 * @since 1.0.0
 * @deprecated Use {@link processUserDataV2} for new projects
 */
async function processUserData(
  data: UserData,
  options: ProcessingOptions = {}
): Promise<AnalyticsReport> {
  // Implementation
}
```

## Qoder Integration

### Chat Mode
```
"Generate README for this project"
"Create API documentation for these endpoints"
"Add JSDoc comments to this function"
"Write OpenAPI spec for this module"
```

### Agent Mode
```
1. Select files/modules to document
2. Activate: "Use documentation-generation skill"
3. Specify type: readme/api/inline/all
```

### Quest Mode
For comprehensive documentation:
- Duration: 20-40 minutes
- Scope: project or major module
- Deliverable: complete documentation suite

## Completion Criteria
- [ ] README.md with all sections
- [ ] API documentation complete
- [ ] Inline docs for complex functions
- [ ] Code examples compile and work
- [ ] Links are valid
- [ ] No TODO placeholders
- [ ] Proofread for clarity

---
**Skill Version**: 1.0.0
**Based on**: claude-howto documentation skills
**Adapted for**: Qoder IDE
