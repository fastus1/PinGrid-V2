# Testing Patterns

**Analysis Date:** 2026-01-28

## Test Framework

**Runner:**
- **Status:** Not yet implemented
- Backend `package.json` has placeholder: `"test": "echo \"Tests will be added later\" && exit 0"`
- No test framework installed (Jest, Vitest, Mocha not in dependencies)

**Assertion Library:**
- None currently configured

**Run Commands:**
```bash
npm test              # Backend: placeholder, exits with message
npm run dev          # Development mode - use for manual testing
npm run lint         # Lint code
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
```

**Frontend:**
- No test scripts configured
- No testing libraries in dependencies

## Test File Organization

**Current Status:**
- Backend: `/backend/tests/` directory exists but is empty
- Frontend: No test directory structure
- Location pattern: TBD - to be determined when testing is implemented

**Naming Convention (Recommended):**
- Co-locate tests with source files or place in parallel `__tests__` directory
- Naming: `[feature].test.js` or `[feature].spec.js`
- Example locations (when implemented):
  - `backend/src/modules/bookmarks/__tests__/bookmarks.service.test.js`
  - `backend/src/modules/auth/__tests__/auth.controller.test.js`
  - `frontend/src/features/groups/__tests__/groupsStore.test.js`

## Test Structure

**Recommended Pattern for Backend:**

Based on codebase conventions, tests should follow this structure:

```javascript
/**
 * BookmarksService tests
 * Test all CRUD operations and business logic
 */
describe('BookmarksService', () => {
  describe('createBookmark', () => {
    it('should create a bookmark with valid data', () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const bookmarkData = {
        title: 'Test Bookmark',
        url: 'https://example.com',
        description: 'A test bookmark'
      };

      // Act
      const result = bookmarksService.createBookmark(userId, groupId, bookmarkData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Test Bookmark');
    });

    it('should throw error when title is missing', () => {
      // Arrange
      const bookmarkData = { url: 'https://example.com' };

      // Act & Assert
      expect(() =>
        bookmarksService.createBookmark('user-123', 'group-456', bookmarkData)
      ).toThrow('Bookmark title is required');
    });

    it('should validate URL format', () => {
      // Arrange
      const bookmarkData = {
        title: 'Invalid URL',
        url: 'not-a-valid-url'
      };

      // Act & Assert
      expect(() =>
        bookmarksService.createBookmark('user-123', 'group-456', bookmarkData)
      ).toThrow('Invalid URL format');
    });
  });

  describe('deleteBookmark', () => {
    it('should delete bookmark when user owns it', () => {
      // Test deletion logic
    });

    it('should throw error when user does not own bookmark', () => {
      // Test access control
    });
  });
});
```

**Patterns:**
- AAA pattern: Arrange → Act → Assert
- Descriptive test names using `it('should...')`
- Group related tests using `describe()`
- Test both success and error cases

## Mocking

**Framework:** TBD (likely Jest or Vitest when implemented)

**Recommended Patterns:**

For service layer tests, mock the model/database layer:
```javascript
// Mock the Bookmark model
jest.mock('../bookmarks.model');

describe('BookmarksService', () => {
  it('should create bookmark after validation', () => {
    // Mock model to return a created bookmark
    Bookmark.create.mockResolvedValue({
      id: '123',
      title: 'Test',
      url: 'https://example.com'
    });

    const result = bookmarksService.createBookmark(userId, groupId, data);

    expect(Bookmark.create).toHaveBeenCalled();
    expect(result.id).toBe('123');
  });
});
```

For controller tests, mock the service layer:
```javascript
jest.mock('../bookmarks.service');

describe('BookmarksController', () => {
  it('should return 201 on successful creation', async () => {
    const mockBookmark = { id: '123', title: 'Test' };
    bookmarksService.createBookmark.mockResolvedValue(mockBookmark);

    const req = { body: { title: 'Test', url: 'https://example.com' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await bookmarksController.create(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: mockBookmark })
    );
  });
});
```

**What to Mock:**
- Database/Model layer (when testing services)
- External services (favicon service, auth service)
- HTTP requests/Axios calls
- Redis operations
- Environment variables (process.env)

**What NOT to Mock:**
- Business logic being tested
- Validation logic (test it as-is)
- Error handling logic

## Fixtures and Factories

**Test Data Pattern (Recommended):**

Create factory functions to generate test data consistently:

```javascript
// fixtures/bookmarkFactory.js
function createBookmarkData(overrides = {}) {
  return {
    title: 'Test Bookmark',
    url: 'https://example.com',
    description: 'A test bookmark',
    favicon_url: 'https://example.com/favicon.ico',
    ...overrides
  };
}

function createBookmark(overrides = {}) {
  return {
    id: 'bookmark-123',
    user_id: 'user-123',
    group_id: 'group-456',
    position: 1,
    visit_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...createBookmarkData(overrides)
  };
}

export { createBookmarkData, createBookmark };
```

**Location (Recommended):**
- `/backend/tests/fixtures/` for factory functions
- `/backend/tests/fixtures/bookmarkFactory.js`
- `/backend/tests/fixtures/userFactory.js`
- `/backend/tests/fixtures/groupFactory.js`

**Usage:**
```javascript
import { createBookmark } from '../fixtures/bookmarkFactory';

it('should calculate stats correctly', () => {
  const bookmark = createBookmark({ visit_count: 10 });
  // ... test logic
});
```

## Coverage

**Requirements:**
- Not enforced currently
- Target recommended: 80%+ for critical business logic
- Service layer: 100% (validation and error cases)
- Controllers: 80%+ (HTTP handling)
- Utils: 90%+ (critical helpers)

**View Coverage (Recommended):**
```bash
npm test -- --coverage
```

Expected output format:
```
File                    | % Stmts | % Branch | % Funcs | % Lines |
BookmarksService.js    | 100     | 95       | 100     | 100     |
BookmarksController.js | 85      | 80       | 90      | 85      |
```

## Test Types

**Unit Tests:**
- Scope: Individual functions/methods in isolation
- Approach: Mock all external dependencies
- Examples:
  - `bookmarksService.createBookmark()` validation
  - `PagesService.isValidHexColor()` color validation
  - Error handling in `errorHandler.js`
- Location: `backend/src/modules/[feature]/__tests__/`

**Integration Tests:**
- Scope: Service + Model layers with real or seeded database
- Approach: Use test database, transaction rollback after each test
- Examples:
  - Full bookmark creation flow (validation → database insert)
  - User creation with access control verification
  - Transaction handling for multi-step operations
- Location: `backend/tests/integration/`

**E2E Tests:**
- Framework: Not used currently
- Recommended: Playwright or Cypress when implementing frontend testing
- Scope: Full user workflows (login → create page → add bookmarks)

## Common Patterns

**Async Testing:**

Backend (with Jest):
```javascript
// Using async/await
it('should fetch bookmarks from database', async () => {
  const bookmarks = await bookmarksService.getGroupBookmarks(userId, groupId);
  expect(bookmarks).toEqual(expect.arrayContaining([...]));
});

// Using .resolves matcher
it('should return bookmarks', () => {
  return expect(
    bookmarksService.getGroupBookmarks(userId, groupId)
  ).resolves.toContainEqual(expect.objectContaining({ id: 'bookmark-123' }));
});
```

**Error Testing:**

```javascript
it('should throw ValidationError for empty title', async () => {
  const promise = bookmarksService.createBookmark(
    userId,
    groupId,
    { url: 'https://example.com' } // missing title
  );

  await expect(promise).rejects.toThrow('Bookmark title is required');
});

// Or using try-catch
it('should catch and handle errors', async () => {
  try {
    await bookmarksService.createBookmark(userId, groupId, invalidData);
    fail('Should have thrown error');
  } catch (error) {
    expect(error.message).toContain('required');
  }
});
```

**Database Transaction Testing:**

```javascript
it('should rollback transaction on error', async () => {
  // Start transaction
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await service.create(...);
    // Force error
    throw new Error('Simulated error');
  } catch (error) {
    await client.query('ROLLBACK');
    expect(await client.query('SELECT * FROM bookmarks')).toHaveLength(0);
  } finally {
    client.release();
  }
});
```

**Request/Response Testing:**

```javascript
describe('BookmarksController', () => {
  it('should return 400 for invalid URL', async () => {
    const req = {
      userId: 'user-123',
      body: {
        title: 'Bad URL',
        url: 'not-a-url'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await bookmarksController.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('URL format')
      })
    );
  });
});
```

## Frontend Testing (Recommended Pattern)

When implementing frontend tests with Vitest + React Testing Library:

**Component Test Example:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import BookmarkCard from '../BookmarkCard';

describe('BookmarkCard', () => {
  it('should render bookmark with title and favicon', () => {
    const bookmark = {
      id: '123',
      title: 'Example',
      url: 'https://example.com',
      favicon_url: 'https://example.com/favicon.ico'
    };

    render(
      <BookmarkCard
        bookmark={bookmark}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText('Example')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/favicon.ico');
  });

  it('should call onDelete when delete button clicked', () => {
    const onDelete = jest.fn();
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={onDelete}
        onEdit={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('Delete bookmark'));
    expect(onDelete).toHaveBeenCalledWith(mockBookmark);
  });
});
```

**Store Test Example (Zustand):**
```javascript
import { renderHook, act } from '@testing-library/react';
import { useBookmarksStore } from '../bookmarksStore';

describe('useBookmarksStore', () => {
  it('should fetch bookmarks and update state', async () => {
    const { result } = renderHook(() => useBookmarksStore());

    act(() => {
      result.current.fetchBookmarks('group-123');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.bookmarksByGroup['group-123']).toBeDefined();
    });
  });
});
```

## Implementation Roadmap

**Phase 1: Backend Unit Tests**
1. Set up test framework (Jest or Vitest)
2. Test validation logic in service layer
3. Test error handling in controllers
4. Coverage target: 80%+ for services

**Phase 2: Backend Integration Tests**
1. Set up test database
2. Test full CRUD flows with database
3. Test transaction handling
4. Coverage target: 70%+ for integration scenarios

**Phase 3: Frontend Component Tests**
1. Set up Vitest + React Testing Library
2. Test critical components (modals, drag-drop)
3. Test store actions
4. Coverage target: 70%+

**Phase 4: E2E Tests**
1. Set up Playwright or Cypress
2. Test user workflows (auth → content management)
3. Test drag-drop interactions

---

*Testing analysis: 2026-01-28*
