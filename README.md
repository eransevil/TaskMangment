# Task Management Platform

An extensible task management platform built with a functional, composition-based architecture that cleanly separates core workflow rules from task-specific logic.

## Live Demo

- **Frontend**: [https://task-mangment-two.vercel.app/]
- **Backend API**: [https://taskmangment-production-56e9.up.railway.app/api]

## Architecture Highlights

This platform demonstrates a clean, extensible architecture that separates core workflow logic from task-specific implementations. The design follows functional composition principles, avoiding classical OOP inheritance in favor of explicit contracts and a registry-based pattern that enables adding new task types without modifying existing code.

### Core Design Principles

1. **Registry-Based Task Types**: New task types can be added without modifying existing code by implementing the `TaskTypeHandler` interface and registering it.

2. **Centralized Workflow Engine**: All state transitions (advance, reverse, close) are handled by pure functions (`changeStatus`, `closeTask`) in `workflow.ts` that enforce rules for all task types.

3. **Functional Composition**: The architecture uses pure functions and plain objects rather than classes. Task type handlers are plain objects implementing the `TaskTypeHandler` interface, and services are pure functions that compose together.

4. **Separation of Concerns**:
   - **Core Workflow Rules** (`src/core/workflow.ts`): Pure functions that apply to all tasks
   - **Task-Specific Rules** (`src/task-types/`): Plain objects with functions that apply only to specific task types

### Adding a New Task Type

To add a new task type (e.g., "Marketing"):

1. Create a new handler file: `src/task-types/marketing-handler.ts`
2. Implement the `TaskTypeHandler` interface
3. Register it in `src/task-types/index.ts`
4. Add the new type to the `TaskType` enum in `src/entities/Task.ts`

No changes needed to:

- Workflow engine
- Task service
- API routes
- Existing task type handlers

## Project Structure

```
TaskManagement/
├── src/                          # Backend source
│   ├── config/                   # Configuration files
│   │   └── data-source.ts       # TypeORM data source
│   ├── core/                     # Core business logic
│   │   ├── workflow.ts          # Centralized workflow engine
│   │   └── task-type-registry.ts # Task type registry system
│   ├── entities/                 # Database entities
│   │   ├── User.ts
│   │   └── Task.ts
│   ├── task-types/               # Task type handlers
│   │   ├── procurement-handler.ts
│   │   ├── development-handler.ts
│   │   └── index.ts             # Handler registration
│   ├── services/                 # Business logic services
│   │   └── task-service.ts
│   ├── routes/                   # API routes
│   │   ├── task-routes.ts
│   │   └── user-routes.ts
│   ├── scripts/                  # Utility scripts
│   │   └── seed.ts              # Database seeding
│   ├── migrations/               # Database migrations
│   └── server.ts                 # Express server
├── client/                       # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── api.ts               # API client
│   │   ├── types.ts             # TypeScript types
│   │   └── App.tsx
│   └── public/
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database:

```bash
createdb task_management
# Or using psql:
# psql -U postgres
# CREATE DATABASE task_management;
```

### 2. Backend Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=task_management
PORT=3001
```

3. Build the project:

```bash
npm run build
```

4. Seed the database:

```bash
npm run seed
```

This will create sample users and tasks.

5. Start the server:

```bash
npm run dev
# Or for production:
# npm start
```

The backend API will be available at `http://localhost:3001`

### 3. Frontend Setup

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The frontend will be available at `http://localhost:3000` (Create React App default). The proxy in `package.json` is configured to forward API requests to the backend.

## API Endpoints

### Tasks

- `GET /api/tasks` - Get all tasks (optional query: `?userId=<id>`)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id` - Update a task
- `POST /api/tasks/:id/advance` - Advance task to next status (body: `{ nextAssigneeId?: string, customFields?: {...} }`)
- `POST /api/tasks/:id/reverse` - Reverse task to previous status (body: `{ nextAssigneeId?: string, customFields?: {...} }`)
- `POST /api/tasks/:id/close` - Close a task (only from final status)

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

## Task Types

Each task type has **per-status data requirements** (see Workflow Model section below). There are no global required fields at task creation - requirements are enforced when advancing to each status.

### Procurement Task

- **Max Status**: 3
- **Status 1 (Created)**: No required data
- **Status 2 (Supplier offers received)**: Requires `quote1` and `quote2` (strings)
- **Status 3 (Purchase completed)**: Requires `receipt` (string)
- **Close**: Only from status 3

### Development Task

- **Max Status**: 4
- **Status 1 (Created)**: No required data
- **Status 2 (Specification completed)**: Requires `specification` (string)
- **Status 3 (Development completed)**: Requires `branch` (string)
- **Status 4 (Distribution completed)**: Requires `version` (string or number)
- **Close**: Only from status 4

## Workflow Model

All tasks share a common **core workflow**:

- Status is an **integer** starting from **1** and going up to a **task-type-specific max**:
  - Procurement: max status = 3
  - Development: max status = 4
- A task has a **lifecycle state**:
  - `OPEN` – normal, mutable
  - `CLOSED` – terminal, **immutable**
- Forward moves:
  - Always **sequential**: `1 → 2 → 3 ...` (no skipping)
  - Disallowed beyond the max status for that task type
- Backward moves:
  - Always allowed while `OPEN`: `n → n-1` down to `1`
- Close:
  - Only allowed from the **final status** (max status)
  - Once closed, the task cannot be modified or moved
- **Data Continuity**:
  - All previously entered custom fields are preserved as read-only context
  - Provides a complete audit trail of all data entered throughout the task lifecycle
  - No data loss when advancing or reversing task statuses

### Per-Type Status Meanings & Requirements

#### Procurement Task

- **Status 1 – Created**
  - Meaning: Task created
  - Required data: none
- **Status 2 – Supplier offers received**
  - Meaning: Quotes collected
  - Required data:
    - `quote1` (string)
    - `quote2` (string)
- **Status 3 – Purchase completed (final)**
  - Meaning: Purchase is done
  - Required data:
    - `receipt` (string)
- **Closed**
  - Can only close from status **3**
  - No extra data required at close time (but status 3 must already have `receipt`)

#### Development Task

- **Status 1 – Created**
  - Meaning: Task created
  - Required data: none
- **Status 2 – Specification completed**
  - Required data:
    - `specification` (string)
- **Status 3 – Development completed**
  - Required data:
    - `branch` (string)
- **Status 4 – Distribution completed (final)**
  - Required data:
    - `version` (string or number)
- **Closed**
  - Can only close from status **4**
  - No extra data required at close time (but status 4 must already have `version`)

## Example Usage

### Creating a Procurement Task

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy Office Supplies",
    "description": "Order new supplies",
    "type": "procurement",
    "assigneeId": "<user-id>",
    "customFields": {}
  }'
```

### Creating a Development Task

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement Feature X",
    "description": "Add new feature",
    "type": "development",
    "assigneeId": "<user-id>",
    "customFields": {}
  }'
```

### Changing Status – Procurement (Status 1 → 2)

```bash
curl -X POST http://localhost:3001/api/tasks/<task-id>/advance \
  -H "Content-Type: application/json" \
  -d '{
    "nextAssigneeId": "<user-id-optional>",
    "customFields": {
      "quote1": "1000 USD from Vendor A",
      "quote2": "950 USD from Vendor B"
    }
  }'
```

### Changing Status – Procurement (Status 2 → 3)

```bash
curl -X POST http://localhost:3001/api/tasks/<task-id>/advance \
  -H "Content-Type: application/json" \
  -d '{
    "customFields": {
      "receipt": "Receipt #12345"
    }
  }'
```

### Changing Status – Development (Status 1 → 2)

```bash
curl -X POST http://localhost:3001/api/tasks/<task-id>/advance \
  -H "Content-Type: application/json" \
  -d '{
    "customFields": {
      "specification": "Full feature specification text..."
    }
  }'
```

### Changing Status – Development (Status 2 → 3)

```bash
curl -X POST http://localhost:3001/api/tasks/<task-id>/advance \
  -H "Content-Type: application/json" \
  -d '{
    "customFields": {
      "branch": "feature/awesome-feature"
    }
  }'
```

### Changing Status – Development (Status 3 → 4)

```bash
curl -X POST http://localhost:3001/api/tasks/<task-id>/advance \
  -H "Content-Type: application/json" \
  -d '{
    "customFields": {
      "version": "1.2.3"
    }
  }'
```

### Closing a Task

```bash
curl -X POST http://localhost:3001/api/tasks/<task-id>/close
```

## Development

### Running Migrations

```bash
# Generate migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Code Structure

- **Entities**: Define database schema using TypeORM decorators
- **Core**: Contains workflow functions (`changeStatus`, `closeTask`) and registry functions - no task-specific logic
- **Task Types**: Plain objects implementing the `TaskTypeHandler` interface with validation and field transformation functions
- **Services**: Pure functions that orchestrate workflow functions and task type handlers
- **Routes**: HTTP endpoints that call service functions
