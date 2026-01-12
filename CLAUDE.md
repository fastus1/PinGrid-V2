# PinGrid V2.0 - Claude Code Context

## Project Overview

PinGrid V2.0 is a modern, visual bookmark management system with a 4-level hierarchical organization structure: Pages → Sections → Groups → Bookmarks. The project follows an iterative development approach with clear milestones and progress tracking.

**Author**: Yannick
**Version**: 2.0.0
**License**: MIT

## Tech Stack

### Frontend
- **Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Routing**: React Router v6
- **State Management**: Zustand 4.4
- **HTTP Client**: Axios
- **Drag & Drop**: @dnd-kit/core (to be added in Iteration 3)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 4.18
- **Database**: PostgreSQL
- **Caching**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Security**: Helmet, CORS
- **Dev Tools**: nodemon

### Infrastructure
- **Containerization**: Docker Compose (PostgreSQL + Redis)
- **Environment**: .env files for configuration

## Architecture

### Hierarchy
```
📄 PAGE (Top-level container: "Work", "Personal")
  ↓
📦 SECTION (Vertical drag & drop blocks)
  ↓
🗂️ GROUP (1-6 column grid containers)
  ↓
🔖 BOOKMARK (Individual cards with favicons)
```

### Module Structure
Both frontend and backend follow feature-based organization:

**Backend** (`backend/src/`):
- `modules/` - Feature modules (auth, pages, sections, groups, bookmarks)
- `shared/` - Shared config, middleware, utilities
- `server.js` - Main entry point

**Frontend** (`frontend/src/`):
- `features/` - Feature-based components
- `shared/` - Reusable components
- `App.jsx` - Main application component

## Development Guidelines

### Code Style
- Use ES6+ features (async/await, arrow functions, destructuring)
- Prefer functional components with hooks in React
- Use camelCase for variables/functions, PascalCase for components
- Keep functions small and focused on single responsibility
- Avoid over-engineering - implement only what's needed for current iteration

### Security Best Practices
- **NEVER** commit sensitive data (.env files, credentials)
- Always validate and sanitize user input
- Prevent SQL injection using parameterized queries
- Implement proper JWT token validation
- Use bcrypt for password hashing (never store plain text)
- Protect against XSS, CSRF, and OWASP Top 10 vulnerabilities
- Use Helmet middleware for security headers

### API Conventions
- RESTful endpoints with clear naming
- Consistent response format:
  ```json
  {
    "success": true/false,
    "data": {},
    "message": "string",
    "timestamp": "ISO string"
  }
  ```
- Proper HTTP status codes (200, 201, 400, 401, 404, 500)
- JWT tokens in Authorization header: `Bearer <token>`

### Database Patterns
- Use parameterized queries to prevent SQL injection
- Implement proper indexes for performance
- Use transactions for multi-step operations
- Follow PostgreSQL naming conventions (snake_case for columns)

### State Management
- Zustand for global state (user auth, pages data)
- React useState for local component state
- Minimize prop drilling with Zustand stores

## Project Structure

```
PinGrid V2.0/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/         # JWT authentication
│   │   │   ├── pages/        # Pages CRUD
│   │   │   ├── sections/     # Sections CRUD + drag & drop
│   │   │   ├── groups/       # Groups CRUD (manual + dynamic)
│   │   │   └── bookmarks/    # Bookmarks CRUD + click tracking
│   │   ├── shared/
│   │   │   ├── config/       # Database, Redis config
│   │   │   ├── middleware/   # Auth, error handling
│   │   │   └── utils/        # Helper functions
│   │   └── server.js         # Express app entry
│   ├── .env                   # Environment variables (gitignored)
│   ├── .env.example          # Template for .env
│   └── package.json
├── frontend/                  # React Vite App
│   ├── src/
│   │   ├── features/         # Feature components
│   │   │   ├── auth/        # Login, Register
│   │   │   ├── pages/       # Pages management
│   │   │   ├── sections/    # Sections with DnD
│   │   │   ├── groups/      # Groups display
│   │   │   └── bookmarks/   # Bookmark cards
│   │   ├── shared/
│   │   │   ├── components/  # Reusable UI components
│   │   │   └── stores/      # Zustand stores
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                  # Environment variables (gitignored)
│   ├── .env.example         # Template for .env
│   └── package.json
├── docker-compose.yml        # PostgreSQL + Redis services
├── .gitignore
├── PLAN.md                   # Full architectural plan
├── PLAN_ITERATIF.md         # Iterative implementation plan
├── PROGRESS.md              # Overall progress tracker
├── PROGRESS_ITERATION_X.md  # Per-iteration progress
├── QUICKSTART.md            # Quick start guide
└── README.md                # Project documentation
```

## Development Workflow

### Initial Setup
1. Start Docker services: `docker-compose up -d`
2. Install backend deps: `cd backend && npm install`
3. Install frontend deps: `cd frontend && npm install`
4. Copy .env.example to .env in both directories
5. Start backend: `npm run dev` (port 5000)
6. Start frontend: `npm run dev` (port 3000)

### Development Ports
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Health Check
Backend health endpoint: `GET http://localhost:5000/health`

### Iteration-Based Development
The project follows a structured iterative approach:
1. Complete current iteration fully before moving to next
2. Test each iteration thoroughly
3. Update PROGRESS_ITERATION_X.md files
4. Each iteration builds on previous foundations

**Current Status**: See PROGRESS.md for latest iteration

### Iterations Roadmap
0. Setup & Foundation ✅
1. Authentication (JWT)
2. Pages Management
3. Sections with Drag & Drop
4. Groups (Manual & Dynamic)
5. Bookmarks CRUD
6. Click Tracking
7. Dynamic "Top Used" Groups
8. Static Page Generation
9-11. Advanced Drag & Drop
12+. Advanced Features

## Key Implementation Details

### Authentication Flow
- JWT tokens with configurable expiry
- Refresh token strategy (if implemented)
- Protected routes middleware
- Password hashing with bcrypt

### Drag & Drop Architecture
- Uses @dnd-kit/core library
- Sections are draggable within pages (vertical reordering)
- Future: Bookmarks draggable between groups

### Dynamic Groups
- "Top Used" groups auto-populate based on click tracking
- Configurable threshold (e.g., top 10 bookmarks)
- Real-time updates from Redis cache

### Performance Considerations
- Redis caching for frequently accessed data
- Proper database indexing
- Lazy loading for large datasets
- Optimistic UI updates where appropriate

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://pingrid:pingrid@localhost:5432/pingrid
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## Common Commands

### Backend
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests (to be implemented)
```

### Frontend
```bash
npm run dev         # Start Vite dev server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Docker
```bash
docker-compose up -d        # Start services in background
docker-compose ps          # Check service status
docker-compose logs        # View logs
docker-compose down        # Stop all services
docker-compose down -v     # Stop and remove volumes (deletes data)
```

## Troubleshooting

### Port Conflicts (Windows)
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database Connection Issues
1. Verify Docker containers are running: `docker-compose ps`
2. Check .env has correct DATABASE_URL
3. Verify PostgreSQL is accessible on port 5432

### Frontend API Connection
1. Check backend is running on port 5000
2. Verify VITE_API_URL in frontend/.env
3. Check CORS configuration in backend

## Important Notes

### What to Avoid
- Over-engineering features beyond current iteration requirements
- Adding unnecessary abstractions or premature optimizations
- Implementing features not explicitly requested
- Committing .env files or sensitive credentials
- Using force push to main/master branch
- Skipping git hooks or security validations

### What to Prioritize
- Clean, readable code that follows project patterns
- Security best practices (input validation, SQL injection prevention)
- Proper error handling and user feedback
- Iterative completion - finish current work before moving on
- Testing each feature thoroughly before marking complete

## Additional Documentation

- **PLAN.md**: Comprehensive architectural planning document
- **PLAN_ITERATIF.md**: Detailed iteration-by-iteration implementation guide
- **PROGRESS.md**: Real-time development progress tracking
- **QUICKSTART.md**: Quick reference for getting started
- **README.md**: User-facing project documentation

## Questions or Issues?

Refer to documentation files for detailed information:
- Architecture questions → PLAN.md
- Implementation details → PLAN_ITERATIF.md
- Current status → PROGRESS.md
- Setup help → README.md or QUICKSTART.md
