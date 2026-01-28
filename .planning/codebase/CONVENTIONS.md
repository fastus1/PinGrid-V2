# Coding Conventions

**Analysis Date:** 2026-01-28

## Naming Patterns

**Files:**
- Backend modules: `[feature].controller.js`, `[feature].service.js`, `[feature].model.js`, `[feature].routes.js`
  - Example: `bookmarks.controller.js`, `pages.service.js`, `auth.model.js`
- Frontend components: PascalCase with `.jsx` extension
  - Example: `BookmarkCard.jsx`, `GroupCard.jsx`, `CreatePageModal.jsx`
- Frontend utilities/services: camelCase with `.js` extension
  - Example: `bookmarksService.js`, `cacheService.js`, `authService.js`
- Frontend stores: `[feature]Store.js` using Zustand
  - Example: `bookmarksStore.js`, `groupsStore.js`, `authStore.js`
- Backend middleware: `[name].middleware.js`
  - Example: `auth.middleware.js`, `errorHandler.js`

**Functions:**
- camelCase for all function and method names
- Action words first: `create`, `fetch`, `delete`, `update`, `get`, `set`, `clear`, `track`
- Example: `createBookmark()`, `fetchGroups()`, `trackBookmarkClick()`

**Variables:**
- camelCase for local variables and parameters
- UPPERCASE_SNAKE_CASE for constants and configuration values
- Prefix with underscore for ignored parameters in arrow functions: `(_id, value) => {}`
  - ESLint rule: `no-unused-vars` with `argsIgnorePattern: '^_'`
- Example: `const apiUrl = ''`, `const STORE_NAME = 'page-cache'`

**Types/Classes:**
- PascalCase for class names and component names
- Example: `AuthController`, `BookmarkCard`, `BookmarksService`

**Constants:**
- UPPERCASE_SNAKE_CASE for module-level constants
- Example: `const DB_VERSION = 1`, `const DB_NAME = 'pingrid-cache'`

## Code Style

**Formatting:**
- Tool: Prettier 3.7.4
- Tab width: 2 spaces
- Semi-colons: Always (`semi: true`)
- Quotes: Single quotes (`singleQuote: true`)
- Print width: 100 characters
- Trailing commas: ES5 compatible (`trailingComma: "es5"`)
- Bracket spacing: Yes (`bracketSpacing: true`)
- Arrow function parentheses: Always (`arrowParens: "always"`)

**Linting:**
- Tool: ESLint 9.39.2
- Config extends: `eslint:recommended` + `prettier`
- Environment: Node.js ES2022 for backend, browser ES2022 for frontend

**Key Linting Rules:**
- `no-unused-vars`: Warn, ignore patterns starting with `_`
- `no-console`: Off (allowed in Node.js backend)
- `prefer-const`: Error (use const over let when possible)
- `no-var`: Error (use const/let, never var)
- `eqeqeq`: Error (always strict equality ===)
- `no-async-promise-executor`: Error (avoid anti-patterns)
- `require-await`: Warn (async functions should use await)

## Import Organization

**Order (Backend):**
1. Built-in Node.js modules (`const express = require(...)`)
2. Third-party modules (`const bcrypt = require(...)`)
3. Local modules/services (`const authService = require(...)`)

Example from `auth.controller.js`:
```javascript
const authService = require('./auth.service');
```

**Order (Frontend):**
1. React and third-party React libraries (`import { useState } from 'react'`)
2. External libraries (`import axios from 'axios'`)
3. Features (feature-relative imports)
4. Shared utilities and components (`import { useTheme } from '../../../shared/...'`)

Example from `GroupCard.jsx`:
```javascript
import { useState } from 'react';
import BookmarkList from '../../bookmarks/components/BookmarkList';
import { useBookmarksStore } from '../../bookmarks/store/bookmarksStore';
import { useTheme } from '../../../shared/theme/useTheme';
```

**Path Aliases:**
- Backend: No aliases, relative paths preferred
- Frontend: No explicit aliases configured in vite.config, relative paths used (e.g., `../../../shared/`)

## Error Handling

**Backend Patterns:**
- Use `try-catch` blocks in all async functions
- Pass errors to Express error handler middleware via `next(error)`
- Validation errors thrown as `Error` instances with descriptive messages
- Controller catches specific errors (e.g., `Invalid credentials`) and returns appropriate status codes

Example from `auth.controller.js`:
```javascript
try {
  const result = await authService.login({ email, password });
  res.json({ success: true, message: 'Login successful', data: result });
} catch (error) {
  if (error.message === 'Invalid credentials') {
    return res.status(401).json({ success: false, error: error.message });
  }
  next(error);
}
```

- Global error handler middleware catches all errors
- Response format: `{ success: false, error: "message", stack?: "stack trace in dev" }`

Example from `errorHandler.js`:
```javascript
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
```

**Frontend Patterns:**
- Services return `{ success: boolean, data?: object, error?: string }`
- Store actions set `loading` and `error` state
- Components display errors to users via state
- No global error handler observed; each store manages its own error state

Example from `bookmarksStore.js`:
```javascript
try {
  const response = await bookmarksService.create(groupId, bookmarkData, token);
  return { success: true, bookmark: newBookmark };
} catch (error) {
  const errorMessage = error.response?.data?.message || error.message;
  set({ error: errorMessage, loading: false });
  return { success: false, error: errorMessage };
}
```

## Logging

**Framework:** `console` (Node.js backend)

**Patterns:**
- Allowed in Node.js backend (ESLint `no-console: off`)
- Use emoji prefixes for visual clarity in logs
- Levels: info (✅), warn (⚠️), error (❌), debug (🔍)

Examples from `bookmarks.service.js`:
```javascript
console.log(`🔍 Auto-fetching favicon for: ${url.trim()}`);
console.log(`✅ Favicon fetched: ${finalFaviconUrl.substring(0, 100)}...`);
console.warn('⚠️ Favicon fetch failed, using default:', error.message);
```

**Frontend:** No explicit logging patterns observed; errors handled in store state

## Comments

**When to Comment:**
- Function/method headers: Always use JSDoc format
- Complex validation logic: Inline comments explaining business rules
- French comments acceptable (mixed with English in some files)

**JSDoc/TSDoc:**
- Format: `/** ... */` with `@param`, `@returns`, `@throws` tags
- Mandatory for all service methods and public functions
- Include purpose, parameters, return type, and error cases

Example from `bookmarks.service.js`:
```javascript
/**
 * Créer un nouveau bookmark avec validation
 * @param {string} userId - UUID du user
 * @param {string} groupId - UUID du group parent
 * @param {object} bookmarkData - { title, url, description?, favicon_url? }
 * @returns {Promise<object>} Bookmark créé
 * @throws {Error} Si validation échoue
 */
async createBookmark(userId, groupId, bookmarkData) {
```

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Average service methods 20-50 lines (includes validation)
- Validation logic comes first in service methods

**Parameters:**
- Use destructuring for object parameters: `async updateBookmark(userId, bookmarkId, updates)`
- Prefer named parameters over positional for clarity
- Maximum 4-5 parameters; use object for more

**Return Values:**
- Services return promise-based objects with validation
- Controllers return JSON responses via `res.json()` or `res.status().json()`
- Stores return `{ success, data/error, ... }` objects
- Components use React hooks for return values

## Module Design

**Exports:**
- Backend: `module.exports = new ClassName()` for service instances (singleton pattern)
- Backend: `module.exports = router` for route modules
- Frontend: `export const useStore = create(...)` for Zustand stores
- Frontend: `export default function Component()` for React components

Example from `bookmarks.controller.js`:
```javascript
class BookmarksController {
  // ... methods
}
module.exports = new BookmarksController();
```

Example from `searchStore.js`:
```javascript
export const useSearchStore = create((set, get) => ({
  // ... store definition
}));
```

**Barrel Files:**
- Frontend feature directories don't use barrel files (index.js)
- Direct imports used: `import GroupCard from '../../groups/components/GroupCard'`

## Response Format (API)

**Consistent response format across all endpoints:**
```javascript
{
  success: true/false,
  message: "optional message string",
  data: { /* response payload */ },
  timestamp: "optional ISO string",
  error: "only in error responses"
}
```

Status codes:
- 200: GET successful, POST successful
- 201: Resource created
- 400: Bad request (validation error)
- 401: Unauthorized (invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Resource not found
- 500: Server error

## Async/Await

**Patterns:**
- Always use `async/await` over promises for readability
- ESLint enforces `require-await` (warn) - functions declared async should use await
- No promise chains observed; all code uses async/await

Example from `auth.service.js`:
```javascript
async register({ email, password, firstName, lastName }) {
  // ... validation
  const hashedPassword = await bcrypt.hash(password, 10);
  // ... create user
}
```

## React Component Patterns

**Hooks usage:**
- `useState` for local component state
- Custom hooks for shared logic (e.g., `useTheme`, `useBookmarkDrag`)
- No class components observed; all functional components

**Props:**
- JSDoc comments above component for prop documentation
- Destructuring in function parameters
- PropTypes not used; TypeScript types not enforced

**Styling:**
- Inline styles with theme integration (glassmorphism pattern)
- Theme-aware styles created as `const themedStyles = { ... }`
- CSS-in-JS object notation with camelCase properties

Example from `GroupCard.jsx`:
```javascript
const themedStyles = {
  card: {
    ...styles.card,
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.border,
    backdropFilter: `blur(${theme.glass.blur})`
  }
};
```

## Validation Patterns

**Backend validation:**
- Happens in service layer before database operations
- Check for required fields, length limits, format (URL, hex color, etc.)
- Return descriptive error messages for each validation rule
- Example from `bookmarks.service.js`: title required, URL format validation, description max 500 chars

**Frontend validation:**
- Form validation in component state before API call
- Error messages displayed in modals and forms
- No client-side validation library observed; manual validation

## Database Query Patterns

**Parameterized queries:**
- All database operations use parameterized queries to prevent SQL injection
- Connection pool via `pg` module
- Transactions for multi-step operations

**Naming conventions:**
- Snake_case for database column names
- UUID for all IDs (user_id, group_id, page_id, etc.)
- Timestamps: created_at, updated_at (ISO format)

---

*Convention analysis: 2026-01-28*
